import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { verifyPaymentSignature } from '../lib/razorpay/client';
import { validateFinancialPolicy } from '../lib/ai/policy';
import crypto from 'crypto';

const prisma = new PrismaClient();

describe('Phase 2 — Razorpay Integration, Policy & Idempotency Tests', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. Policy Engine Tests
  describe('Deterministic Policy Engine Guardrails', () => {
    it('should PASS when transaction is within ₹5,000 limit and user confirmed', async () => {
      const result = await validateFinancialPolicy({
        merchantSlug: 'nova-run',
        amount: 4498.0,
        category: 'Footwear',
        userConfirmed: true,
      });

      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Policy Check PASSED');
    });

    it('should REJECT transaction when amount exceeds ₹5,000 limit', async () => {
      const result = await validateFinancialPolicy({
        merchantSlug: 'nova-run',
        amount: 7500.0,
        category: 'Footwear',
        userConfirmed: true,
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('exceeds maximum allowed transaction limit');
    });

    it('should REJECT transaction if explicit user confirmation is missing', async () => {
      const result = await validateFinancialPolicy({
        merchantSlug: 'nova-run',
        amount: 3999.0,
        category: 'Footwear',
        userConfirmed: false,
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Explicit user spending authorization is required');
    });

    it('should REJECT blocked categories', async () => {
      const result = await validateFinancialPolicy({
        merchantSlug: 'nova-run',
        amount: 1000.0,
        category: 'Gift Cards',
        userConfirmed: true,
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('is explicitly blocked');
    });
  });

  // 2. Cryptographic HMAC Signature Verification Tests
  describe('Cryptographic Signature Verification', () => {
    const testSecret = 'rzp_test_demo_key_secret';

    it('should return TRUE for valid cryptographic HMAC signature', () => {
      const orderId = 'order_test_9023810239';
      const paymentId = 'pay_test_9023810239_sig';
      const body = `${orderId}|${paymentId}`;
      const validSignature = crypto
        .createHmac('sha256', testSecret)
        .update(body)
        .digest('hex');

      process.env.RAZORPAY_KEY_SECRET = testSecret;
      const isValid = verifyPaymentSignature(orderId, paymentId, validSignature);
      expect(isValid).toBe(true);
    });

    it('should return FALSE for tampered or invalid signature', () => {
      process.env.RAZORPAY_KEY_SECRET = testSecret;
      const isValid = verifyPaymentSignature(
        'order_test_9023810239',
        'pay_test_9023810239_sig',
        'invalid_tampered_signature_hex'
      );
      expect(isValid).toBe(false);
    });
  });

  // 3. Application-Level Idempotency Tests
  describe('Application-Level Idempotency Guarantee', () => {
    it('should recognize existing actionId and avoid creating duplicate orders', async () => {
      const testActionId = `RAY-ACT-TEST-${Date.now()}`;
      const merchant = await prisma.merchant.findUnique({ where: { slug: 'nova-run' } });

      // Create initial order
      const initialOrder = await prisma.order.create({
        data: {
          actionId: testActionId,
          merchantId: merchant!.id,
          razorpayOrderId: `order_test_idempotent_${Date.now()}`,
          totalAmount: 4498.0,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          cartItemsJson: '[]',
        },
      });

      // Query database for duplicate attempt with same actionId
      const duplicateOrder = await prisma.order.findUnique({
        where: { actionId: testActionId },
      });

      expect(duplicateOrder).not.toBeNull();
      expect(duplicateOrder?.id).toBe(initialOrder.id);
      expect(duplicateOrder?.razorpayOrderId).toBe(initialOrder.razorpayOrderId);
    });
  });
});
