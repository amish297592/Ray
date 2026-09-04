import { z } from 'zod';

export const ParsedIntentSchema = z.object({
  rawQuery: z.string(),
  category: z.string().default('Footwear'),
  useCase: z.string().default('daily training'),
  terrain: z.string().default('road'),
  quality: z.string().default('standard'),
  maxBudget: z.number().optional().default(Infinity),
  hasExplicitBudget: z.boolean().default(false),
  requiredItems: z.array(z.string()).default(['shoes']),
  optionalItems: z.array(z.string()).default(['accessories']),
  explicitProductName: z.string().optional(),
  minRating: z.number().optional(),
});

export type ParsedIntent = z.infer<typeof ParsedIntentSchema>;

/**
 * Enhanced Deterministic & AI Intent Parser
 * Converts natural-language queries into structured Zod intent.
 * Handles arbitrary natural language intent without hardcoded price constraints.
 */
export function parseBuyerIntent(rawQuery: string): ParsedIntent {
  const safeQuery = rawQuery && rawQuery.trim().length > 0 ? rawQuery : 'Find top recommended running setup';
  const queryLower = safeQuery.toLowerCase();
  const cleanQuery = queryLower.replace(/,/g, ''); // Strip commas e.g. ₹5,000 -> ₹5000

  // Extract explicit budget preference if mentioned by user (e.g. "under ₹4500", "budget 3000", "under ₹5000", "around 3000")
  let maxBudget = Infinity;
  let hasExplicitBudget = false;

  const budgetMatch = cleanQuery.match(/(?:under|below|less than|budget|max|around|approx|₹|\$)\s*(\d{3,6})/);
  if (budgetMatch && budgetMatch[1]) {
    maxBudget = parseInt(budgetMatch[1], 10);
    hasExplicitBudget = true;
  }

  // Extract Quality preference
  let quality = 'standard';
  if (queryLower.includes('premium') || queryLower.includes('best') || queryLower.includes('pro') || queryLower.includes('top tier')) {
    quality = 'premium';
  } else if (queryLower.includes('budget') || queryLower.includes('cheap') || queryLower.includes('affordable')) {
    quality = 'budget';
  }

  // Extract Terrain & Use Case
  let terrain = 'road';
  let useCase = 'daily training';

  if (queryLower.includes('trail') || queryLower.includes('mountain') || queryLower.includes('offroad') || queryLower.includes('mud')) {
    terrain = 'trail';
    useCase = 'trail running';
  } else if (queryLower.includes('marathon') || queryLower.includes('race') || queryLower.includes('long distance')) {
    terrain = 'road / race';
    useCase = 'marathon';
  } else if (queryLower.includes('rain') || queryLower.includes('waterproof') || queryLower.includes('gtx')) {
    terrain = 'all-weather';
    useCase = 'wet conditions';
  }

  // Extract Explicit Product Name Hints
  let explicitProductName: string | undefined;
  if (queryLower.includes('nova runner') || queryLower.includes('x1 pro')) {
    explicitProductName = 'nova runner';
  } else if (queryLower.includes('trail blazer') || queryLower.includes('gtx')) {
    explicitProductName = 'trail blazer';
  } else if (queryLower.includes('apex') || queryLower.includes('gps') || queryLower.includes('smartwatch')) {
    explicitProductName = 'apex gps';
  }

  // Extract Category / Required Items
  const requiredItems: string[] = [];
  const optionalItems: string[] = ['accessories'];

  if (queryLower.includes('shoe') || queryLower.includes('runner') || queryLower.includes('footwear') || queryLower.includes('sneaker') || queryLower.includes('kit') || queryLower.includes('setup')) {
    requiredItems.push('shoes');
  }
  if (queryLower.includes('watch') || queryLower.includes('gps') || queryLower.includes('smartwatch') || queryLower.includes('electronics')) {
    requiredItems.push('electronics');
  }
  if (queryLower.includes('accessory') || queryLower.includes('accessories') || queryLower.includes('gear')) {
    optionalItems.push('accessories');
  }
  if (queryLower.includes('sock')) {
    optionalItems.push('socks');
  }
  if (queryLower.includes('hydration') || queryLower.includes('vest') || queryLower.includes('bottle')) {
    optionalItems.push('hydration');
  }

  if (requiredItems.length === 0) {
    requiredItems.push('shoes');
  }

  let category = 'Footwear';
  if (queryLower.includes('accessory') || queryLower.includes('accessories')) {
    category = 'Accessories';
  } else if (requiredItems.includes('electronics')) {
    category = 'Electronics';
  }

  return ParsedIntentSchema.parse({
    rawQuery: safeQuery,
    category,
    useCase,
    terrain,
    quality,
    maxBudget,
    hasExplicitBudget,
    requiredItems,
    optionalItems,
    explicitProductName,
  });
}
