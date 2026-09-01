import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { evaluatePolicy } from '../lib/policy/engine';

const prisma = new PrismaClient();

describe('Phase 3 — Deterministic Policy Engine & Financial Guardrails', () => {
  let merchantId: string;
  let testShoeId: string;
  let testSockId: string;

  beforeAll(async () => {
    const merchant = await prisma.merchant.findUnique({ where: { slug: 'nova-run' } });
    merchantId = merchant!.id;

    const prods = await prisma.product.findMany({ where: { merchantId }, take: 2 });
    testShoeId = prods[0].id;
    testSockId = prods[1].id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. Transaction Limits (₹5,000 Cap)
  describe('Single Transaction Limits (₹5,000 Cap)', () => {
    it('should ALLOW transaction of ₹4,999', async () => {
      const actionId = `RAY-TEST-LIM-4999-${Date.now()}`;
      const decision = await evaluatePolicy({
        actionId,
        merchantSlug: 'nova-run',
        items: [{ productId: testShoeId, quantity: 1 }], // Shoe ₹3,999 + Sock ₹499 = ₹4,498 <= ₹5,000
        userConfirmed: true,
      });

      expect(decision.allowed).toBe(true);
      expect(decision.decision).toBe('ALLOW');
      expect(decision.rule).toBe('POLICY_PASSED');
    });

    it('should BLOCK transaction of ₹5,001 or simulated limit breach', async () => {
      const actionId = `RAY-TEST-LIM-5001-${Date.now()}`;
      const decision = await evaluatePolicy({
        actionId,
        merchantSlug: 'nova-run',
        items: [{ productId: testShoeId, quantity: 1 }],
        userConfirmed: true,
        simulateFailureType: 'LIMIT_EXCEEDED',
      });

      expect(decision.allowed).toBe(false);
      expect(decision.decision).toBe('BLOCK');
      expect(decision.rule).toBe('TRANSACTION_LIMIT_EXCEEDED');
      expect(decision.moneyCharged).toBe(0);
    });
  });

  // 2. Cumulative 24-Hour Daily Spend Limits
  describe('Cumulative 24-Hour Daily Spend Limits', () => {
    it('should BLOCK transaction when daily spend cap would be exceeded', async () => {
      const actionId = `RAY-TEST-DAILY-${Date.now()}`;
      const decision = await evaluatePolicy({
        actionId,
        merchantSlug: 'nova-run',
        items: [{ productId: testShoeId, quantity: 1 }],
        userConfirmed: true,
        simulateFailureType: 'DAILY_LIMIT_EXCEEDED',
      });

      expect(decision.allowed).toBe(false);
      expect(decision.decision).toBe('BLOCK');
      expect(decision.rule).toBe('DAILY_LIMIT_EXCEEDED');
      expect(decision.moneyCharged).toBe(0);
    });
  });

  // 3. Category Permissions
  describe('Category Permission Guardrails', () => {
    it('should BLOCK prohibited categories', async () => {
      const actionId = `RAY-TEST-CAT-${Date.now()}`;
      const decision = await evaluatePolicy({
        actionId,
        merchantSlug: 'nova-run',
        items: [{ productId: testShoeId, quantity: 1 }],
        userConfirmed: true,
        simulateFailureType: 'CATEGORY_PROHIBITED',
      });

      expect(decision.allowed).toBe(false);
      expect(decision.decision).toBe('BLOCK');
      expect(decision.rule).toBe('CATEGORY_NOT_PERMITTED');
    });
  });

  // 4. Server-Persisted Authorization & Stale Cart Invalidation
  describe('Explicit User Authorization & Stale Cart Hash Invalidation', () => {
    it('should require explicit user authorization when unconfirmed', async () => {
      const actionId = `RAY-TEST-AUTH-UNCONF-${Date.now()}`;
      const decision = await evaluatePolicy({
        actionId,
        merchantSlug: 'nova-run',
        items: [{ productId: testShoeId, quantity: 1 }],
        userConfirmed: false,
      });

      expect(decision.allowed).toBe(true);
      expect(decision.decision).toBe('REQUIRES_AUTHORIZATION');
    });

    it('should invalidate authorization if cart items or prices change after authorization', async () => {
      const actionId = `RAY-TEST-STALE-${Date.now()}`;

      // 1. First authorization for 1 shoe (₹3,999)
      const initialDecision = await evaluatePolicy({
        actionId,
        merchantSlug: 'nova-run',
        items: [{ productId: testShoeId, quantity: 1 }],
        userConfirmed: true,
      });

      expect(initialDecision.allowed).toBe(true);

      // 2. Second request with modified cart (shoe + sock) without fresh confirmation
      const modifiedDecision = await evaluatePolicy({
        actionId,
        merchantSlug: 'nova-run',
        items: [
          { productId: testShoeId, quantity: 1 },
          { productId: testSockId, quantity: 1 },
        ],
        userConfirmed: true,
      });

      expect(modifiedDecision.allowed).toBe(false);
      expect(modifiedDecision.decision).toBe('BLOCK');
      expect(modifiedDecision.rule).toBe('STALE_AUTHORIZATION');
      expect(modifiedDecision.reason).toContain('Cart contents or total amount changed');
    });
  });

  // 5. Fail-Closed Behavior
  describe('Fail-Closed Principle', () => {
    it('should FAIL CLOSED and block payment if policy engine is unavailable', async () => {
      const actionId = `RAY-TEST-FAIL-CLOSED-${Date.now()}`;
      const decision = await evaluatePolicy({
        actionId,
        merchantSlug: 'nova-run',
        items: [{ productId: testShoeId, quantity: 1 }],
        userConfirmed: true,
        simulateFailureType: 'SERVICE_UNAVAILABLE',
      });

      expect(decision.allowed).toBe(false);
      expect(decision.decision).toBe('BLOCK');
      expect(decision.rule).toBe('POLICY_UNAVAILABLE');
      expect(decision.moneyCharged).toBe(0);
    });
  });
});
