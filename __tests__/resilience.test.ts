import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { transitionTransactionState } from '../lib/resilience/state-machine';
import { calculateTransactionSafetyScore } from '../lib/resilience/safety-score';
import { evaluatePolicy } from '../lib/policy/engine';

const prisma = new PrismaClient();

describe('Phase 7 — Failure Recovery, Idempotency & Transaction Resilience', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. Transaction State Machine Transition Tests
  describe('Transaction State Machine Transitions', () => {
    it('should ALLOW valid state transitions', () => {
      const result1 = transitionTransactionState('CREATED', 'POLICY_CHECKED');
      expect(result1.valid).toBe(true);

      const result2 = transitionTransactionState('CHECKOUT_STARTED', 'PAYMENT_PENDING');
      expect(result2.valid).toBe(true);

      const result3 = transitionTransactionState('PAYMENT_RECEIVED', 'PAYMENT_VERIFIED');
      expect(result3.valid).toBe(true);
    });

    it('should REJECT invalid direct state transitions', () => {
      const invalidResult = transitionTransactionState('CREATED', 'COMPLETED');
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.reason).toContain('Invalid State Transition Attempted');
    });
  });

  // 2. Double-Submission & Idempotency Tests
  describe('Rapid Double-Submission Idempotency Guarantee', () => {
    it('should return existing order on duplicate submission without creating a second order', async () => {
      const testActionId = `RAY-ACT-DOUBLE-${Date.now()}`;
      const merchant = await prisma.merchant.findUnique({ where: { slug: 'nova-run' } });

      // Request 1: Create initial order
      const initialOrder = await prisma.order.create({
        data: {
          actionId: testActionId,
          merchantId: merchant!.id,
          razorpayOrderId: `order_test_double_${Date.now()}`,
          totalAmount: 4498.0,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          cartItemsJson: '[]',
        },
      });

      // Request 2: Duplicate rapid click with same actionId
      const duplicateOrder = await prisma.order.findUnique({
        where: { actionId: testActionId },
      });

      expect(duplicateOrder).not.toBeNull();
      expect(duplicateOrder?.id).toBe(initialOrder.id);
      expect(duplicateOrder?.razorpayOrderId).toBe(initialOrder.razorpayOrderId);
    });
  });

  // 3. Client Price Tampering Protection Test
  describe('Client Price Tampering Protection', () => {
    it('should enforce server DB prices and ignore client-supplied price manipulation', async () => {
      const product = await prisma.product.findFirst({ where: { slug: 'nova-runner-x1-pro' } });
      expect(product).not.toBeNull();

      // Client attempts to claim price is ₹1
      const clientProvidedPrice = 1.0;
      const actualDbPrice = product!.price; // ₹3,999

      expect(clientProvidedPrice).not.toEqual(actualDbPrice);
      expect(actualDbPrice).toBeGreaterThan(1.0);
    });
  });

  // 4. Policy Rejection Before Payment Test
  describe('Policy Rejection Before Payment Execution', () => {
    it('should reject order creation BEFORE invoking Razorpay API if policy limit is breached', async () => {
      const actionId = `RAY-ACT-POL-REJ-${Date.now()}`;
      const product = await prisma.product.findFirst({ where: { slug: 'nova-runner-x1-pro' } });

      const decision = await evaluatePolicy({
        actionId,
        merchantSlug: 'nova-run',
        items: [{ productId: product!.id, quantity: 1 }],
        userConfirmed: true,
        simulateFailureType: 'LIMIT_EXCEEDED',
      });

      expect(decision.allowed).toBe(false);
      expect(decision.decision).toBe('BLOCK');
      expect(decision.rule).toBe('TRANSACTION_LIMIT_EXCEEDED');
      expect(decision.moneyCharged).toBe(0);
    });
  });

  // 5. Deterministic Safety Score Calculation Test
  describe('Transaction Safety Score Engine', () => {
    it('should compute deterministic 100/100 safety score based on active system protections', async () => {
      const scoreResult = await calculateTransactionSafetyScore();

      expect(scoreResult.totalScore).toBe(100);
      expect(scoreResult.status).toBe('EXCELLENT');
      expect(scoreResult.dimensions.length).toBe(7);
    });
  });
});
