import { z } from 'zod';

export const ParsedIntentSchema = z.object({
  rawQuery: z.string(),
  category: z.string().default('Footwear'),
  useCase: z.string().default('daily training'),
  terrain: z.string().default('road'),
  maxBudget: z.number().optional().default(Infinity),
  hasExplicitBudget: z.boolean().default(false),
  requiredItems: z.array(z.string()).default(['shoes']),
  optionalItems: z.array(z.string()).default(['accessories']),
  minRating: z.number().optional(),
});

export type ParsedIntent = z.infer<typeof ParsedIntentSchema>;

/**
 * Deterministic & AI Intent Parser
 * Converts natural-language queries into structured Zod intent.
 * The AI Buyer accepts arbitrary shopping intent without hardcoded price constraints.
 */
export function parseBuyerIntent(rawQuery: string): ParsedIntent {
  const queryLower = rawQuery.toLowerCase();
  const cleanQuery = queryLower.replace(/,/g, ''); // Strip commas e.g. ₹5,000 -> ₹5000

  // Extract explicit budget preference if mentioned by user (e.g. "under ₹4500", "budget 3000", "under ₹5000")
  let maxBudget = Infinity;
  let hasExplicitBudget = false;

  const budgetMatch = cleanQuery.match(/(?:under|below|less than|budget|max|₹|\$)\s*(\d{3,6})/);
  if (budgetMatch && budgetMatch[1]) {
    maxBudget = parseInt(budgetMatch[1], 10);
    hasExplicitBudget = true;
  }

  // Extract Terrain
  let terrain = 'road';
  if (queryLower.includes('trail') || queryLower.includes('mountain') || queryLower.includes('offroad')) {
    terrain = 'trail';
  } else if (queryLower.includes('marathon') || queryLower.includes('race')) {
    terrain = 'road / race';
  }

  // Extract Category / Required Items
  const requiredItems: string[] = [];
  const optionalItems: string[] = ['accessories'];

  if (queryLower.includes('shoe') || queryLower.includes('runner') || queryLower.includes('footwear')) {
    requiredItems.push('shoes');
  }
  if (queryLower.includes('watch') || queryLower.includes('gps') || queryLower.includes('smartwatch')) {
    requiredItems.push('electronics');
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

  const category = requiredItems.includes('electronics') ? 'Electronics' : 'Footwear';

  return ParsedIntentSchema.parse({
    rawQuery,
    category,
    useCase: queryLower.includes('trail') ? 'trail running' : queryLower.includes('marathon') ? 'marathon' : 'daily training',
    terrain,
    maxBudget,
    hasExplicitBudget,
    requiredItems,
    optionalItems,
  });
}
