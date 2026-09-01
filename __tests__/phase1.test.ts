import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Phase 1 - Database Schema & Seed Verification', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should find Nova Run demo merchant with correct slug', async () => {
    const merchant = await prisma.merchant.findUnique({
      where: { slug: 'nova-run' },
    });
    expect(merchant).not.toBeNull();
    expect(merchant?.name).toBe('Nova Run');
    expect(merchant?.category).toBe('Sports & Fitness');
    expect(merchant?.readinessScore).toBe(92);
  });

  it('should have 35 seeded products', async () => {
    const productCount = await prisma.product.count();
    expect(productCount).toBe(35);
  });

  it('should have seed product relationships for upsell and cross-sell', async () => {
    const relationships = await prisma.productRelationship.findMany();
    expect(relationships.length).toBeGreaterThanOrEqual(5);
  });

  it('should have a spending policy set for Nova Run', async () => {
    const merchant = await prisma.merchant.findUnique({
      where: { slug: 'nova-run' },
      include: { policies: true },
    });
    expect(merchant?.policies.length).toBeGreaterThan(0);
    const policy = merchant?.policies[0];
    expect(policy?.maxTransactionLimit).toBe(5000);
    expect(policy?.requireUserConfirmation).toBe(true);
  });

  it('should have seeded AI Commerce Passport', async () => {
    const merchant = await prisma.merchant.findUnique({
      where: { slug: 'nova-run' },
      include: { aiProfile: true },
    });
    expect(merchant?.aiProfile).not.toBeNull();
    const passportData = JSON.parse(merchant?.aiProfile?.rawPassportJson || '{}');
    expect(passportData.merchant_name).toBe('Nova Run');
    expect(passportData.ai_readiness_score).toBe(92);
  });
});
