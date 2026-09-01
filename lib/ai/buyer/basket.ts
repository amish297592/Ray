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
  status: 'OPTIMIZED' | 'BUDGET_EXCEEDED' | 'NO_VALID_BASKET';
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
 * Maximizes relevance + complementary graph attach value subject to:
 * totalAmount <= maxBudget
 */
export async function optimizeBuyerBasket(
  rankedCandidates: RankedProduct[],
  maxBudget: number,
  merchantSlug: string = 'nova-run'
): Promise<OptimizedBasketResult> {
  if (rankedCandidates.length === 0) {
    return {
      valid: false,
      status: 'NO_VALID_BASKET',
      items: [],
      totalAmount: 0,
      maxBudget,
      remainingBudget: maxBudget,
      recommendationExplanation: `No products available within budget of ₹${maxBudget.toLocaleString()}.`,
    };
  }

  // 1. Select Primary Hero Product (Highest relevance score within budget)
  const hero = rankedCandidates[0];

  if (hero.price > maxBudget) {
    return {
      valid: false,
      status: 'BUDGET_EXCEEDED',
      items: [],
      totalAmount: 0,
      maxBudget,
      remainingBudget: maxBudget,
      recommendationExplanation: `Hero product ${hero.title} (₹${hero.price.toLocaleString()}) exceeds stated budget limit of ₹${maxBudget.toLocaleString()}.`,
    };
  }

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
  let remaining = maxBudget - currentTotal;

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

  let recommendationExplanation = `Selected ${hero.title} (₹${hero.price.toLocaleString()}) matching stated intent.`;

  // 3. Evaluate Complementary Attachments within Remaining Budget
  for (const rel of relationships) {
    const target = rel.targetProduct;
    if (target.price <= remaining) {
      items.push({
        id: target.id,
        title: target.title,
        price: target.price,
        category: target.category,
        imageUrl: target.imageUrl,
        rationale: `AI Recommended Addition: ${rel.rationale} (+₹${target.price})`,
        isRecommendation: true,
      });

      currentTotal += target.price;
      remaining -= target.price;
      recommendationExplanation += ` Added ${target.title} (+₹${target.price.toLocaleString()}) within remaining budget ₹${(remaining + target.price).toLocaleString()}.`;
      break; // Single optimized complementary recommendation for clean basket
    }
  }

  // 4. Check for Upsell Upgrade Candidate
  let suggestedUpsell;
  const higherTierCandidate = rankedCandidates.find(
    (p) => p.price > hero.price && p.price <= maxBudget
  );

  if (higherTierCandidate) {
    suggestedUpsell = {
      currentProductId: hero.id,
      targetProduct: higherTierCandidate,
      priceDelta: higherTierCandidate.price - hero.price,
    };
  }

  currentTotal = Number(currentTotal.toFixed(2));
  remaining = Number(remaining.toFixed(2));

  // Hard Budget Enforcement Verification
  if (currentTotal > maxBudget) {
    return {
      valid: false,
      status: 'BUDGET_EXCEEDED',
      items: [],
      totalAmount: currentTotal,
      maxBudget,
      remainingBudget: maxBudget - currentTotal,
      recommendationExplanation: `Hard Budget Violation: Calculated total ₹${currentTotal} exceeds max budget ₹${maxBudget}. Basket rejected.`,
    };
  }

  return {
    valid: true,
    status: 'OPTIMIZED',
    items,
    totalAmount: currentTotal,
    maxBudget,
    remainingBudget: remaining,
    recommendationExplanation,
    suggestedUpsell,
  };
}
