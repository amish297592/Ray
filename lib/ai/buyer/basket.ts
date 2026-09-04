import prisma from '@/lib/prisma';
import { RankedProduct } from './catalog-search';

export interface OptimizedBasketItem {
  id: string;
  title: string;
  price: number;
  category: string;
  imageUrl: string | null;
  rationale: string;
  isRecommendation: boolean;
}

export interface OptimizedBasketResult {
  valid: boolean;
  status: 'OPTIMIZED' | 'NO_VALID_BASKET';
  items: OptimizedBasketItem[];
  totalAmount: number;
  maxBudget: number;
  remainingBudget: number;
  recommendationExplanation: string;
  suggestedUpsell?: {
    currentProductId: string;
    targetProduct: RankedProduct;
    priceDelta: number;
  };
}

/**
 * Deterministic Basket Optimization Algorithm
 * The AI Buyer searches the catalog freely based on intent and builds an optimized recommendation basket.
 * Financial constraints (e.g. ₹5,000 single limit, ₹20,000 daily spend) are evaluated by the Policy Engine.
 */
export async function optimizeBuyerBasket(
  rankedCandidates: RankedProduct[],
  maxBudget: number = Infinity,
  merchantSlug: string = 'nova-run'
): Promise<OptimizedBasketResult> {
  if (rankedCandidates.length === 0) {
    return {
      valid: false,
      status: 'NO_VALID_BASKET',
      items: [],
      totalAmount: 0,
      maxBudget: maxBudget === Infinity ? 0 : maxBudget,
      remainingBudget: maxBudget === Infinity ? 0 : maxBudget,
      recommendationExplanation: 'No matching products found in catalog for specified intent.',
    };
  }

  // 1. Select Primary Hero Product (Highest relevance score for intent)
  const hero = rankedCandidates[0];

  const items: OptimizedBasketItem[] = [
    {
      id: hero.id,
      title: hero.title,
      price: hero.price,
      category: hero.category,
      imageUrl: hero.imageUrl,
      rationale: `Primary match for intent: ${hero.matchReasons.join('. ')}`,
      isRecommendation: false,
    },
  ];

  let currentTotal = hero.price;
  const isBudgetConstrained = maxBudget !== Infinity && maxBudget > 0;
  let remaining = isBudgetConstrained ? maxBudget - currentTotal : Infinity;

  // 2. Query Database for Cross-Sell Graph Attachments for Hero Product
  const relationships = await prisma.productRelationship.findMany({
    where: {
      sourceProductId: hero.id,
      status: 'ACTIVE',
    },
    include: {
      targetProduct: true,
    },
    orderBy: { confidence: 'desc' },
  });

  let recommendationExplanation = `Selected ${hero.title} (₹${hero.price.toLocaleString()}) matching buyer intent.`;

  // 3. Evaluate Complementary Attachments from Graph
  for (const rel of relationships) {
    const target = rel.targetProduct;
    const isWithinBudget = !isBudgetConstrained || target.price <= remaining;

    if (isWithinBudget || relationships.length === 1) {
      items.push({
        id: target.id,
        title: target.title,
        price: target.price,
        category: target.category,
        imageUrl: target.imageUrl,
        rationale: `AI Cross-Sell Recommendation: ${rel.rationale} (+₹${target.price.toLocaleString()})`,
        isRecommendation: true,
      });

      currentTotal += target.price;
      if (isBudgetConstrained) {
        remaining -= target.price;
      }
      recommendationExplanation += ` Added ${target.title} (+₹${target.price.toLocaleString()}) based on high co-occurrence confidence (${Math.round(rel.confidence * 100)}%).`;
      break; // Single optimized complementary recommendation for clean basket
    }
  }

  // 4. Check for Upsell Upgrade Candidate
  let suggestedUpsell;
  const higherTierCandidate = rankedCandidates.find((p) => p.price > hero.price);

  if (higherTierCandidate) {
    suggestedUpsell = {
      currentProductId: hero.id,
      targetProduct: higherTierCandidate,
      priceDelta: higherTierCandidate.price - hero.price,
    };
  }

  currentTotal = Number(currentTotal.toFixed(2));
  const displayRemaining = isBudgetConstrained ? Number(remaining.toFixed(2)) : 0;

  return {
    valid: true,
    status: 'OPTIMIZED',
    items,
    totalAmount: currentTotal,
    maxBudget: isBudgetConstrained ? maxBudget : currentTotal,
    remainingBudget: displayRemaining,
    recommendationExplanation,
    suggestedUpsell,
  };
}
