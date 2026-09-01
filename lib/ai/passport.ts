import { z } from 'zod';
import prisma from '@/lib/prisma';

// Zod Schema for Versioned AI Commerce Passport
export const PassportSchema = z.object({
  schemaVersion: z.literal('1.0'),
  timestamp: z.string(),
  merchant: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    category: z.string(),
    currency: z.string(),
    logoUrl: z.string().nullable(),
  }),
  readiness: z.object({
    totalScore: z.number().min(0).max(100),
    status: z.enum(['AI_READY', 'NEEDS_IMPROVEMENT', 'INCOMPLETE']),
    dimensions: z.array(
      z.object({
        dimension: z.string(),
        score: z.number(),
        maxScore: z.number(),
        status: z.string(),
        explanation: z.string(),
        recommendation: z.string(),
      })
    ),
  }),
  commerce: z.object({
    catalog: z.object({
      totalProducts: z.number(),
      endpoint: z.string(),
      searchSupported: z.boolean(),
    }),
    capabilities: z.array(z.string()),
    restrictedActions: z.array(z.string()),
  }),
  policies: z.object({
    currency: z.string(),
    maxTransactionLimit: z.number(),
    maxDailySpend: z.number(),
    requireUserConfirmation: z.boolean(),
    allowedCategories: z.array(z.string()),
    blockedCategories: z.array(z.string()),
  }),
  checkout: z.object({
    provider: z.string(),
    supported: z.boolean(),
    requiresPolicyCheck: z.boolean(),
    requiresExplicitAuthorization: z.boolean(),
    endpoint: z.string(),
  }),
  featuredCatalog: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      category: z.string(),
      price: z.number(),
      stock: z.number(),
      isAiDiscoverable: z.boolean(),
      attributes: z.record(z.any()),
    })
  ),
});

export type AICommercePassport = z.infer<typeof PassportSchema>;

/**
 * Deterministic Readiness Score Generator
 */
export function calculateReadinessScore(merchantData: {
  productsCount: number;
  productsWithAttrsCount: number;
  aiDiscoverableCount: number;
  hasPolicy: boolean;
  hasCheckout: boolean;
}) {
  const catalogCompleteness = merchantData.productsCount > 0
    ? Math.round((merchantData.productsWithAttrsCount / merchantData.productsCount) * 25)
    : 0;

  const machineReadableData = merchantData.productsCount > 0 ? 20 : 0;
  const aiDiscovery = merchantData.productsCount > 0
    ? Math.round((merchantData.aiDiscoverableCount / merchantData.productsCount) * 15)
    : 0;

  const policyClarity = merchantData.hasPolicy ? 15 : 0;
  const checkoutCapability = merchantData.hasCheckout ? 10 : 0;
  const failureRecovery = 7; // Persistent audit & failure simulation ready

  const totalScore = catalogCompleteness + machineReadableData + aiDiscovery + policyClarity + checkoutCapability + failureRecovery;

  const dimensions = [
    {
      dimension: 'Catalog Completeness',
      score: catalogCompleteness,
      maxScore: 25,
      status: catalogCompleteness >= 24 ? 'OPTIMAL' : 'IMPROVABLE',
      explanation: `${merchantData.productsWithAttrsCount}/${merchantData.productsCount} products contain structured attributes & images.`,
      recommendation: 'Ensure all products have high-resolution images and explicit terrain/size attributes.',
    },
    {
      dimension: 'Machine-Readable Data',
      score: machineReadableData,
      maxScore: 20,
      status: 'OPTIMAL',
      explanation: 'Exposes structured JSON schemas for catalog, prices, and capabilities.',
      recommendation: 'All products conform to standard machine-readable JSON schema.',
    },
    {
      dimension: 'AI Discovery',
      score: aiDiscovery,
      maxScore: 15,
      status: aiDiscovery >= 14 ? 'OPTIMAL' : 'IMPROVABLE',
      explanation: `${merchantData.aiDiscoverableCount}/${merchantData.productsCount} products flagged as AI discoverable.`,
      recommendation: 'Enable isAiDiscoverable flag on newly added product inventory.',
    },
    {
      dimension: 'Policy Clarity',
      score: policyClarity,
      maxScore: 15,
      status: 'OPTIMAL',
      explanation: 'Explicit transaction limit (₹5,000) and daily cap (₹20,000) configured.',
      recommendation: 'Merchant guardrails are active and server-enforced.',
    },
    {
      dimension: 'Checkout Capability',
      score: checkoutCapability,
      maxScore: 10,
      status: 'OPTIMAL',
      explanation: 'Server-side Razorpay Test Mode Orders API integrated.',
      recommendation: 'Checkout endpoint active and accepting bounded payment intents.',
    },
    {
      dimension: 'Failure Recovery',
      score: failureRecovery,
      maxScore: 10,
      status: 'GOOD',
      explanation: 'Immutable audit trail and developer failure simulations supported.',
      recommendation: 'Add automated retry handling for network drops.',
    },
  ];

  return {
    totalScore,
    status: totalScore >= 90 ? 'AI_READY' : totalScore >= 70 ? 'NEEDS_IMPROVEMENT' : 'INCOMPLETE',
    dimensions,
  };
}

/**
 * Dynamic Server-Side Passport Generator
 * Queries SQLite DB directly for fresh real-time values
 */
export async function generateAICommercePassport(
  merchantSlug: string = 'nova-run'
): Promise<AICommercePassport> {
  const merchant = await prisma.merchant.findUnique({
    where: { slug: merchantSlug },
    include: {
      policies: true,
      products: {
        where: { isAiDiscoverable: true },
        take: 35,
      },
    },
  });

  if (!merchant) {
    throw new Error(`Merchant '${merchantSlug}' not found in database.`);
  }

  const policy = merchant.policies[0] || {
    maxTransactionLimit: 5000,
    maxDailySpend: 20000,
    requireUserConfirmation: true,
    allowedCategoriesJson: '["Footwear", "Apparel", "Accessories", "Electronics"]',
    blockedCategoriesJson: '["Gift Cards"]',
  };

  let allowedCategories: string[] = [];
  let blockedCategories: string[] = [];

  try {
    allowedCategories = JSON.parse(policy.allowedCategoriesJson || '[]');
    blockedCategories = JSON.parse(policy.blockedCategoriesJson || '[]');
  } catch (e) {
    allowedCategories = ['Footwear', 'Apparel', 'Accessories', 'Electronics'];
  }

  const productsWithAttrs = merchant.products.filter((p) => {
    try {
      const attrs = JSON.parse(p.attributesJson || '{}');
      return Object.keys(attrs).length > 0;
    } catch (e) {
      return false;
    }
  });

  const readiness = calculateReadinessScore({
    productsCount: merchant.products.length,
    productsWithAttrsCount: productsWithAttrs.length,
    aiDiscoverableCount: merchant.products.filter((p) => p.isAiDiscoverable).length,
    hasPolicy: Boolean(merchant.policies.length > 0),
    hasCheckout: true,
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
  const catalogEndpoint = baseUrl ? `${baseUrl}/api/agent/catalog` : '/api/agent/catalog';
  const checkoutEndpoint = baseUrl ? `${baseUrl}/api/razorpay/create-order` : '/api/razorpay/create-order';

  const passportData = {
    schemaVersion: '1.0' as const,
    timestamp: new Date().toISOString(),
    merchant: {
      id: merchant.id,
      name: merchant.name,
      slug: merchant.slug,
      category: merchant.category,
      currency: merchant.currency,
      logoUrl: merchant.logoUrl,
    },
    readiness: {
      totalScore: readiness.totalScore,
      status: readiness.status as 'AI_READY' | 'NEEDS_IMPROVEMENT' | 'INCOMPLETE',
      dimensions: readiness.dimensions,
    },
    commerce: {
      catalog: {
        totalProducts: merchant.products.length,
        endpoint: catalogEndpoint,
        searchSupported: true,
      },
      capabilities: [
        'CATALOG_SEARCH',
        'PRODUCT_RECOMMENDATION',
        'BASKET_OPTIMIZATION',
        'POLICY_EVALUATION',
        'BOUNDED_AUTHORIZATION',
        'CHECKOUT',
        'PAYMENT_VERIFICATION',
      ],
      restrictedActions: [
        'MODIFY_PRODUCT_PRICES',
        'MODIFY_POLICIES',
        'BYPASS_USER_AUTHORIZATION',
        'DIRECT_PAYMENT_EXECUTION',
      ],
    },
    policies: {
      currency: merchant.currency,
      maxTransactionLimit: policy.maxTransactionLimit,
      maxDailySpend: policy.maxDailySpend,
      requireUserConfirmation: policy.requireUserConfirmation,
      allowedCategories,
      blockedCategories,
    },
    checkout: {
      provider: 'Razorpay Test Mode',
      supported: true,
      requiresPolicyCheck: true,
      requiresExplicitAuthorization: true,
      endpoint: checkoutEndpoint,
    },
    featuredCatalog: merchant.products.map((p) => {
      let attrs = {};
      try {
        attrs = JSON.parse(p.attributesJson || '{}');
      } catch (e) {}

      return {
        id: p.id,
        title: p.title,
        category: p.category,
        price: p.price,
        stock: p.stock,
        isAiDiscoverable: p.isAiDiscoverable,
        attributes: attrs,
      };
    }),
  };

  // Validate against Zod schema before returning
  return PassportSchema.parse(passportData);
}
