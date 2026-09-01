import prisma from '@/lib/prisma';
import { ParsedIntent } from './intent';

export interface RankedProduct {
  id: string;
  title: string;
  category: string;
  price: number;
  description: string;
  imageUrl: string | null;
  attributes: Record<string, any>;
  relevanceScore: number;
  matchReasons: string[];
}

/**
 * Deterministic Catalog Search & Candidate Ranking Engine
 * Queries real database products, enforces budget filter <= maxBudget, and generates attribute match reasons.
 */
export async function searchBuyerCatalog(
  intent: ParsedIntent,
  merchantSlug: string = 'nova-run'
): Promise<RankedProduct[]> {
  const merchant = await prisma.merchant.findUnique({
    where: { slug: merchantSlug },
    include: {
      products: {
        where: {
          price: { lte: intent.maxBudget },
          isAiDiscoverable: true,
        },
      },
    },
  });

  if (!merchant || merchant.products.length === 0) {
    return [];
  }

  const ranked: RankedProduct[] = [];

  for (const prod of merchant.products) {
    let score = 0.5; // Base score
    const matchReasons: string[] = [];

    // Parse structured JSON attributes safely
    let attrs: Record<string, any> = {};
    try {
      attrs = JSON.parse(prod.attributesJson || '{}');
    } catch (e) {
      attrs = {};
    }

    // 1. Price Budget Check
    if (prod.price <= intent.maxBudget) {
      score += 0.2;
      matchReasons.push(`Within requested budget (₹${prod.price.toLocaleString()} ≤ ₹${intent.maxBudget.toLocaleString()})`);
    }

    // 2. Category / Terrain Match
    if (prod.category.toLowerCase() === intent.category.toLowerCase()) {
      score += 0.2;
      matchReasons.push(`Matches requested category '${prod.category}'`);
    }

    if (attrs.terrain && attrs.terrain.toLowerCase().includes(intent.terrain.toLowerCase())) {
      score += 0.1;
      matchReasons.push(`Engineered for ${attrs.terrain} terrain`);
    }

    if (attrs.cushioning) {
      matchReasons.push(`${attrs.cushioning} cushioning for training endurance`);
    }

    ranked.push({
      id: prod.id,
      title: prod.title,
      category: prod.category,
      price: prod.price,
      description: prod.description,
      imageUrl: prod.imageUrl,
      attributes: attrs,
      relevanceScore: Number(score.toFixed(2)),
      matchReasons,
    });
  }

  // Sort by relevance score descending, then by price ascending
  return ranked.sort((a, b) => b.relevanceScore - a.relevanceScore || a.price - b.price);
}
