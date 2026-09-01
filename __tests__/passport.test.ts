import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { generateAICommercePassport, PassportSchema } from '../lib/ai/passport';

const prisma = new PrismaClient();

describe('Phase 6 — AI Commerce Passport & Machine-Readable Merchant', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. Schema Validity & Zod Validation
  describe('Zod Schema Validation & Versioning', () => {
    it('should generate valid Zod-schema-conforming Passport for Nova Run', async () => {
      const passport = await generateAICommercePassport('nova-run');

      expect(passport.schemaVersion).toBe('1.0');
      expect(passport.merchant.slug).toBe('nova-run');
      expect(passport.readiness.totalScore).toBeGreaterThanOrEqual(90);
      expect(passport.commerce.capabilities).toContain('CATALOG_SEARCH');
      expect(passport.checkout.supported).toBe(true);

      // Validate against Zod schema
      expect(() => PassportSchema.parse(passport)).not.toThrow();
    });
  });

  // 2. Critical Dynamic Database Grounding Test
  describe('Dynamic Database Grounding Test', () => {
    it('should dynamically update Passport values when database entries change', async () => {
      const product = await prisma.product.findFirst({ where: { slug: 'nova-runner-x1-pro' } });
      expect(product).not.toBeNull();

      const originalPrice = product!.price;
      const testPrice = 4199.0;

      // Temporarily update price in SQLite DB
      await prisma.product.update({
        where: { id: product!.id },
        data: { price: testPrice },
      });

      // Fetch fresh Passport
      const freshPassport = await generateAICommercePassport('nova-run');
      const updatedProductInPassport = freshPassport.featuredCatalog.find((p) => p.id === product!.id);

      expect(updatedProductInPassport?.price).toBe(testPrice);

      // Restore original DB price
      await prisma.product.update({
        where: { id: product!.id },
        data: { price: originalPrice },
      });
    });
  });

  // 3. Secret Leak Prevention Scan
  describe('Secret Leak Prevention Scan', () => {
    it('should NEVER contain secrets or credentials in generated Passport JSON', async () => {
      const passport = await generateAICommercePassport('nova-run');
      const jsonString = JSON.stringify(passport).toLowerCase();

      expect(jsonString).not.toContain('razorpay_key_secret');
      expect(jsonString).not.toContain('openai_api_key');
      expect(jsonString).not.toContain('gemini_api_key');
      expect(jsonString).not.toContain('password');
      expect(jsonString).not.toContain('secret');
    });
  });

  // 4. Deterministic Readiness Score Test
  describe('Readiness Score Calculation', () => {
    it('should compute deterministic score based on merchant database state', async () => {
      const passport = await generateAICommercePassport('nova-run');
      expect(passport.readiness.totalScore).toBe(92);
      expect(passport.readiness.dimensions.length).toBe(6);
    });
  });
});
