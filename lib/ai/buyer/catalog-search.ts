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
 * Queries real database products and ranks them based on intent relevance.
 * The AI search is unconstrained; financial boundary limits are enforced by the Policy Engine.
 */
export function searchBuyerCatalog(
  intent: ParsedIntent,
  merchantSlug: string = 'nova-run'
): Promise<RankedProduct[]> {
  return (async () => {
    // 1. Query products from database
    let products = await prisma.product.findMany({
      where: {
        merchant: { slug: merchantSlug },
        isAiDiscoverable: true,
      },
    });

    if (products.length === 0) {
      return [];
    }

    const ranked: RankedProduct[] = [];

    for (const prod of products) {
      let score = 0.5; // Base score
      const matchReasons: string[] = [];

      // Parse structured JSON attributes safely
      let attrs: Record<string, any> = {};
      try {
        attrs = JSON.parse(prod.attributesJson || '{}');
      } catch (e) {
        attrs = {};
      }

      // Explicit Product Title Match Boost
      if (intent.explicitProductName && prod.title.toLowerCase().includes(intent.explicitProductName.toLowerCase())) {
        score += 0.4;
        matchReasons.push(`Exact product match: "${prod.title}"`);
      }

      // 1. Budget preference evaluation if specified
      if (intent.hasExplicitBudget && intent.maxBudget && intent.maxBudget !== Infinity) {
        if (prod.price <= intent.maxBudget) {
          score += 0.2;
          matchReasons.push(`Within requested price preference (₹${prod.price.toLocaleString()} ≤ ₹${intent.maxBudget.toLocaleString()})`);
        } else {
          matchReasons.push(`Premium product (₹${prod.price.toLocaleString()})`);
        }
      } else {
        matchReasons.push(`Catalog item price: ₹${prod.price.toLocaleString()}`);
      }

      // Quality match
      if (intent.quality === 'premium' && prod.price > 3500) {
        score += 0.15;
        matchReasons.push(`Matches premium tier quality specification`);
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
  })();
}
