import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseBuyerIntent } from '@/lib/ai/buyer/intent';
import { searchBuyerCatalog } from '@/lib/ai/buyer/catalog-search';

const SearchSchema = z.object({
  query: z.string().min(1, 'Query is required'),
});

export async function POST(
  request: Request,
  { params }: { params: { merchantSlug: string } }
) {
  try {
    const body = await request.json();
    const parseResult = SearchSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_QUERY',
            message: 'Query parameter is missing or empty.',
          },
        },
        { status: 400 }
      );
    }

    const intent = parseBuyerIntent(parseResult.data.query);
    const candidates = await searchBuyerCatalog(intent, params.merchantSlug || 'nova-run');

    if (candidates.length === 0) {
      return NextResponse.json(
        {
          error: {
            code: 'NO_RESULTS',
            message: `No products matching query '${parseResult.data.query}' within budget ₹${intent.maxBudget}`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      query: parseResult.data.query,
      intent,
      matchCount: candidates.length,
      candidates,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error?.message || 'Catalog search execution error',
        },
      },
      { status: 500 }
    );
  }
}
