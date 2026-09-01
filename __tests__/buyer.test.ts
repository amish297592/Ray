import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { parseBuyerIntent } from '../lib/ai/buyer/intent';
import { searchBuyerCatalog } from '../lib/ai/buyer/catalog-search';
import { optimizeBuyerBasket } from '../lib/ai/buyer/basket';
import { runBuyerSession } from '../lib/ai/buyer/buyer-agent';

const prisma = new PrismaClient();

describe('Phase 5 — AI Buyer & Agentic Commerce Engine', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. Intent Parsing Tests
  describe('Intent Parsing', () => {
    it('should parse natural-language query and extract max budget ₹5,000', () => {
      const query = 'Find me the best running setup under ₹5,000.';
      const intent = parseBuyerIntent(query);

      expect(intent.maxBudget).toBe(5000);
      expect(intent.category).toBe('Footwear');
      expect(intent.requiredItems).toContain('shoes');
    });

    it('should parse custom budget and terrain specs', () => {
      const query = 'I need running shoes for trail running under ₹4500';
      const intent = parseBuyerIntent(query);

      expect(intent.maxBudget).toBe(4500);
      expect(intent.terrain).toBe('trail');
      expect(intent.useCase).toBe('trail running');
    });
  });

  // 2. Catalog Search & Product Grounding
  describe('Deterministic Catalog Search', () => {
    it('should filter candidate products where price <= maxBudget', async () => {
      const intent = parseBuyerIntent('Running shoes under ₹4500');
      const candidates = await searchBuyerCatalog(intent, 'nova-run');

      expect(candidates.length).toBeGreaterThan(0);
      for (const cand of candidates) {
        expect(cand.price).toBeLessThanOrEqual(4500);
      }
    });

    it('should rank candidates based on attribute match score', async () => {
      const intent = parseBuyerIntent('Trail running shoes under ₹5000');
      const candidates = await searchBuyerCatalog(intent, 'nova-run');

      expect(candidates[0].relevanceScore).toBeGreaterThanOrEqual(candidates[candidates.length - 1].relevanceScore);
    });
  });

  // 3. Basket Optimization & Budget Guarantee
  describe('Basket Optimization & Budget Guarantee', () => {
    it('should optimize basket total (₹4,498 <= ₹5,000) with complementary cross-sell item', async () => {
      const intent = parseBuyerIntent('Running shoes under ₹5000');
      const candidates = await searchBuyerCatalog(intent, 'nova-run');
      const basket = await optimizeBuyerBasket(candidates, 5000, 'nova-run');

      expect(basket.valid).toBe(true);
      expect(basket.totalAmount).toBeLessThanOrEqual(5000);
      expect(basket.items.length).toBeGreaterThanOrEqual(1);
    });

    it('should REJECT basket if hero price exceeds max budget', async () => {
      const intent = parseBuyerIntent('High-end gear under ₹1000');
      const candidates = await searchBuyerCatalog(intent, 'nova-run');
      // Force candidates to higher prices
      const expensiveCandidates = candidates.filter((c) => c.price > 1000);

      const basket = await optimizeBuyerBasket(expensiveCandidates, 1000, 'nova-run');
      expect(basket.valid).toBe(false);
      expect(['BUDGET_EXCEEDED', 'NO_VALID_BASKET']).toContain(basket.status);
    });
  });

  // 4. AI Buyer Session & Policy Engine Hand-off
  describe('Full AI Buyer Session & Policy Hand-off', () => {
    it('should execute end-to-end AI Buyer session and evaluate Policy Engine', async () => {
      const session = await runBuyerSession({
        rawQuery: 'Find me the best running setup under ₹5,000.',
        merchantSlug: 'nova-run',
        userConfirmed: false,
      });

      expect(session.sessionId).toBeDefined();
      expect(session.basket.valid).toBe(true);
      expect(session.policyDecision).toBeDefined();
      expect(session.auditTrail.length).toBeGreaterThan(0);
    });
  });
});
