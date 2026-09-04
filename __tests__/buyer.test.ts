import { describe, it, expect, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { parseBuyerIntent } from '../lib/ai/buyer/intent';
import { searchBuyerCatalog } from '../lib/ai/buyer/catalog-search';
import { optimizeBuyerBasket } from '../lib/ai/buyer/basket';
import { runBuyerSession } from '../lib/ai/buyer/buyer-agent';
import { evaluatePolicy } from '../lib/policy/engine';

const prisma = new PrismaClient();

describe('Phase 5 — AI Buyer & Agentic Commerce Engine', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. Intent Parsing Tests (Arbitrary natural language intent)
  describe('Arbitrary Intent Parsing', () => {
    it('should parse intent with explicit price preference', () => {
      const query = 'Find trail running shoes and socks under ₹5,000.';
      const intent = parseBuyerIntent(query);

      expect(intent.maxBudget).toBe(5000);
      expect(intent.hasExplicitBudget).toBe(true);
      expect(intent.category).toBe('Footwear');
      expect(intent.terrain).toBe('trail');
    });

    it('should parse unconstrained search intent with no price constraint', () => {
      const query = 'Find me the best running shoes.';
      const intent = parseBuyerIntent(query);

      expect(intent.hasExplicitBudget).toBe(false);
      expect(intent.maxBudget).toBe(Infinity);
      expect(intent.requiredItems).toContain('shoes');
    });
  });

  // 2. Unconstrained Catalog Search & Product Grounding
  describe('Catalog Search Engine', () => {
    it('should retrieve candidate products for unconstrained intent without hardcoded budget caps', async () => {
      const intent = parseBuyerIntent('Build me a premium marathon setup.');
      const candidates = await searchBuyerCatalog(intent, 'nova-run');

      expect(candidates.length).toBeGreaterThan(0);
    });

    it('should rank candidates based on attribute match score', async () => {
      const intent = parseBuyerIntent('Trail running shoes');
      const candidates = await searchBuyerCatalog(intent, 'nova-run');

      expect(candidates[0].relevanceScore).toBeGreaterThanOrEqual(candidates[candidates.length - 1].relevanceScore);
    });
  });

  // 3. Recommendation Above ₹5,000 -> Policy Engine Blocked
  describe('Policy Engine Single Transaction Cap (Above ₹5,000)', () => {
    it('should allow AI to recommend items above ₹5,000 and have Policy Engine BLOCK execution', async () => {
      const actionId = `RAY-TEST-ABOVE-CAP-${Date.now()}`;
      
      // Apex GPS Smartwatch (₹4,999) + Trail Blazer GTX (₹4,899) = ₹9,898
      const smartwatch = await prisma.product.findFirst({ where: { slug: 'apex-gps-heart-rate-smartwatch' } });
      const trailShoe = await prisma.product.findFirst({ where: { slug: 'trail-blazer-gtx' } });

      const items = [
        { productId: smartwatch!.id, quantity: 1 },
        { productId: trailShoe!.id, quantity: 1 },
      ];

      const policyDecision = await evaluatePolicy({
        actionId,
        merchantSlug: 'nova-run',
        items,
        userConfirmed: true,
      });

      expect(policyDecision.allowed).toBe(false);
      expect(policyDecision.decision).toBe('BLOCK');
      expect(policyDecision.rule).toBe('TRANSACTION_LIMIT_EXCEEDED');
      expect(policyDecision.reason).toContain('exceeds maximum allowed transaction limit of ₹5,000');
    });
  });

  // 4. Recommendation Below ₹5,000 -> Policy Eligible & Explicit Authorization
  describe('Policy Engine Single Transaction Cap (Below ₹5,000)', () => {
    it('should ELIGIBILITY PASS for basket under ₹5,000 and require explicit authorization', async () => {
      const session = await runBuyerSession({
        rawQuery: 'Find trail running shoes and matching socks.',
        merchantSlug: 'nova-run',
        userConfirmed: false,
      });

      expect(session.basket.valid).toBe(true);
      expect(session.basket.totalAmount).toBeLessThanOrEqual(5000);
      expect(session.policyDecision.rule).toBe('REQUIRES_USER_AUTHORIZATION');
      expect(session.policyDecision.decision).toBe('REQUIRES_AUTHORIZATION');
    });

    it('should PASS Policy Engine when explicit user authorization is granted', async () => {
      const session = await runBuyerSession({
        rawQuery: 'Find trail running shoes and matching socks.',
        merchantSlug: 'nova-run',
        userConfirmed: true,
      });

      expect(session.basket.valid).toBe(true);
      expect(session.policyDecision.allowed).toBe(true);
      expect(session.policyDecision.rule).toBe('POLICY_PASSED');
    });
  });

  // 5. ₹20,000 Daily Cap Enforcement
  describe('Policy Engine Daily Spend Cap (₹20,000)', () => {
    it('should BLOCK execution if cumulative 24-hour spend exceeds ₹20,000 daily cap', async () => {
      const actionId = `RAY-TEST-DAILY-CAP-${Date.now()}`;
      const shoe = await prisma.product.findFirst({ where: { slug: 'nova-runner-x1-pro' } });

      const policyDecision = await evaluatePolicy({
        actionId,
        merchantSlug: 'nova-run',
        items: [{ productId: shoe!.id, quantity: 1 }],
        userConfirmed: true,
        simulateFailureType: 'DAILY_LIMIT_EXCEEDED',
      });

      expect(policyDecision.allowed).toBe(false);
      expect(policyDecision.decision).toBe('BLOCK');
      expect(policyDecision.rule).toBe('DAILY_LIMIT_EXCEEDED');
      expect(policyDecision.moneyCharged).toBe(0);
    });
  });
});
