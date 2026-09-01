import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  findRevenueOpportunities,
  createCampaignDraft,
  getRevenueAnalytics,
  getProductRelationships,
  calculateCampaignImpact,
} from '../lib/ai/tools';
import { runGrowthAgentAnalysis } from '../lib/ai/agent';

const prisma = new PrismaClient();

describe('Phase 4 & 4.1 — RAY AI Revenue Agent & Campaign Model Transparency', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. Campaign Formula Transparency & Determinism
  describe('Phase 4.1 Campaign Formula Transparency', () => {
    it('should compute exact deterministic campaign revenue impact given identical inputs', () => {
      const eligible = 155;
      const uplift = 4.0; // 4%
      const basket = 3298.0;
      const discount = 10.0; // 10%

      const result1 = calculateCampaignImpact(eligible, uplift, basket, discount);
      const result2 = calculateCampaignImpact(eligible, uplift, basket, discount);

      // 155 * 0.04 = 6.2 orders
      // 6.2 * 3298 = 20447.60 gross
      // 20447.60 * 0.10 = 2044.76 discount cost
      // Net = 20447.60 - 2044.76 = 18402.84
      expect(result1.expectedIncrementalOrders).toBe(6.2);
      expect(result1.grossIncrementalRevenue).toBe(20447.6);
      expect(result1.discountCost).toBe(2044.76);
      expect(result1.netImpact).toBe(18402.84);

      // Reproducibility test
      expect(result1).toEqual(result2);
    });

    it('should calculate campaign opportunity impact deterministically in opportunity engine', async () => {
      const opps = await findRevenueOpportunities('nova-run');
      const campaignOpp = opps.find((o) => o.engine === 'CAMPAIGN');

      expect(campaignOpp).toBeDefined();
      expect(campaignOpp?.offerDiscountPercent).toBe(10);
      expect(campaignOpp?.estimatedRevenueImpact).toBe(18402.84);
      expect(campaignOpp?.rationale).toContain('MODELLED ESTIMATE');
    });
  });

  // 2. Revenue Opportunities & Deterministic Calculation
  describe('Revenue Opportunity Engine & Deterministic Math', () => {
    it('should generate ranked opportunities from database data', async () => {
      const opps = await findRevenueOpportunities('nova-run');

      expect(opps.length).toBeGreaterThan(0);
      expect(opps[0].estimatedRevenueImpact).toBeGreaterThanOrEqual(opps[opps.length - 1].estimatedRevenueImpact);
      expect(opps[0].engine).toBeDefined();
    });

    it('should compute deterministic impact = eligible * uplift * incrementalBasket for cross-sell', async () => {
      const opps = await findRevenueOpportunities('nova-run');
      const crossSellOpp = opps.find((o) => o.engine === 'CROSS_SELL');

      expect(crossSellOpp).toBeDefined();
      const expected = Number(
        (
          crossSellOpp!.eligibleCustomersCount *
          (crossSellOpp!.conversionUpliftModeled / 100) *
          crossSellOpp!.incrementalBasketValue
        ).toFixed(2)
      );

      expect(crossSellOpp!.estimatedRevenueImpact).toBe(expected);
    });
  });

  // 3. Engine A & Engine B Verification
  describe('Engine A (Upsell) & Engine B (Cross-Sell Graph)', () => {
    it('should fetch active ProductRelationship cross-sell graph links', async () => {
      const rels = await getProductRelationships('nova-run');
      expect(rels.length).toBeGreaterThan(0);
      expect(rels[0].relationType).toBeDefined();
      expect(rels[0].confidence).toBeGreaterThan(0);
    });

    it('should generate valid Upsell opportunity comparing products', async () => {
      const opps = await findRevenueOpportunities('nova-run');
      const upsellOpp = opps.find((o) => o.engine === 'UPSELL');

      expect(upsellOpp).toBeDefined();
      expect(upsellOpp?.incrementalBasketValue).toBeGreaterThan(0);
      expect(upsellOpp?.title).toContain('Upgrade');
    });
  });

  // 4. Campaign Orchestrator & Merchant Approval Boundary
  describe('Engine C (Campaign Orchestrator) & Approval Boundary', () => {
    it('should create campaign draft with status DRAFT requiring merchant approval', async () => {
      const title = `Test Marathon Campaign ${Date.now()}`;
      const campaign = await createCampaignDraft({
        merchantSlug: 'nova-run',
        title,
        offerDiscountPercent: 10,
        targetAudience: 'Weekend Endurance Runners',
        durationHours: 48,
      });

      expect(campaign.id).toBeDefined();
      expect(campaign.status).toBe('DRAFT');
      expect(campaign.expectedRevenueImpact).toBe(18402.84);
      expect(campaign.approvedAt).toBeNull();
    });
  });

  // 5. Provider Abstraction & Offline Graceful Degradation
  describe('AI Provider Abstraction & Offline Graceful Degradation', () => {
    it('should degrade to DETERMINISTIC_ENGINE when external API keys are omitted', async () => {
      const analysis = await runGrowthAgentAnalysis({ merchantSlug: 'nova-run' });

      expect(analysis.sessionId).toBeDefined();
      expect(analysis.provider).toBe('DETERMINISTIC_ENGINE');
      expect(analysis.modeLabel).toContain('Deterministic');
      expect(analysis.trace.length).toBeGreaterThan(0);
      expect(analysis.opportunities.length).toBeGreaterThan(0);
    });
  });
});
