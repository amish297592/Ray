import prisma from '@/lib/prisma';
import { RankedProduct } from './catalog-search';
import { ParsedIntent } from './intent';

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
  merchantSlug: string = 'nova-run',
  intent?: ParsedIntent
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

  const queryLower = (intent?.rawQuery || '').toLowerCase();
  const items: OptimizedBasketItem[] = [];
  const addedIds = new Set<string>();

  // Check for explicit multi-product requests in query (e.g., "Apex GPS Smartwatch and Trail Blazer GTX")
  const containsSmartwatch = queryLower.includes('watch') || queryLower.includes('apex') || queryLower.includes('smartwatch');
  const containsShoes = queryLower.includes('shoe') || queryLower.includes('runner') || queryLower.includes('blazer') || queryLower.includes('trail') || queryLower.includes('marathon');
  const containsSocks = queryLower.includes('sock');

  // Multi-item matching logic
  if (containsSmartwatch && containsShoes) {
    const watchProd = rankedCandidates.find((p) => p.category.toLowerCase() === 'electronics' || p.title.toLowerCase().includes('watch'));
    const shoeProd = rankedCandidates.find((p) => p.category.toLowerCase() === 'footwear' || p.title.toLowerCase().includes('blazer') || p.title.toLowerCase().includes('runner'));

    if (watchProd && shoeProd && watchProd.id !== shoeProd.id) {
      items.push({
        id: shoeProd.id,
        title: shoeProd.title,
        price: shoeProd.price,
        category: shoeProd.category,
        imageUrl: shoeProd.imageUrl,
        rationale: `Primary Footwear Match: ${shoeProd.matchReasons.join('. ')}`,
        isRecommendation: false,
      });
      addedIds.add(shoeProd.id);

      items.push({
        id: watchProd.id,
        title: watchProd.title,
        price: watchProd.price,
        category: watchProd.category,
        imageUrl: watchProd.imageUrl,
        rationale: `Primary GPS Electronics Match: ${watchProd.matchReasons.join('. ')}`,
        isRecommendation: false,
      });
      addedIds.add(watchProd.id);
    }
  }

  // If no multi-product match was added yet, pick the top hero candidate
  if (items.length === 0) {
    const hero = rankedCandidates[0];
    items.push({
      id: hero.id,
      title: hero.title,
      price: hero.price,
      category: hero.category,
      imageUrl: hero.imageUrl,
      rationale: `Primary match for intent: ${hero.matchReasons.join('. ')}`,
      isRecommendation: false,
    });
    addedIds.add(hero.id);
  }

  const primaryHero = items[0];
  let currentTotal = items.reduce((sum, item) => sum + item.price, 0);
  const isBudgetConstrained = maxBudget !== Infinity && maxBudget > 0;
  let remaining = isBudgetConstrained ? maxBudget - currentTotal : Infinity;

  // Query Database for Cross-Sell Graph Attachments for Hero Product
  const relationships = await prisma.productRelationship.findMany({
    where: {
      sourceProductId: primaryHero.id,
      status: 'ACTIVE',
    },
    include: {
      targetProduct: true,
    },
    orderBy: { confidence: 'desc' },
  });

  let recommendationExplanation = `Selected ${items.map((i) => i.title).join(' + ')} matching buyer intent.`;

  // Attach complementary products from Graph if not already added
  for (const rel of relationships) {
    const target = rel.targetProduct;
    if (addedIds.has(target.id)) continue;

    const isWithinBudget = !isBudgetConstrained || target.price <= remaining;

    if (isWithinBudget || items.length === 1) {
      items.push({
        id: target.id,
        title: target.title,
        price: target.price,
        category: target.category,
        imageUrl: target.imageUrl,
        rationale: `AI Cross-Sell Recommendation: ${rel.rationale} (+₹${target.price.toLocaleString()})`,
        isRecommendation: true,
      });
      addedIds.add(target.id);

      currentTotal += target.price;
      if (isBudgetConstrained) {
        remaining -= target.price;
      }
      recommendationExplanation += ` Added ${target.title} (+₹${target.price.toLocaleString()}) based on high co-occurrence confidence (${Math.round(rel.confidence * 100)}%).`;
      break; // Single optimized complementary recommendation for clean basket
    }
  }

  // Check for Upsell Upgrade Candidate
  let suggestedUpsell;
  const higherTierCandidate = rankedCandidates.find((p) => !addedIds.has(p.id) && p.price > primaryHero.price);

  if (higherTierCandidate) {
    suggestedUpsell = {
      currentProductId: primaryHero.id,
      targetProduct: higherTierCandidate,
      priceDelta: higherTierCandidate.price - primaryHero.price,
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
