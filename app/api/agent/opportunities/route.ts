import { NextResponse } from 'next/server';
import { findRevenueOpportunities } from '@/lib/ai/tools';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('merchantSlug') || 'nova-run';

    const opportunities = await findRevenueOpportunities(slug);

    return NextResponse.json({
      success: true,
      merchantSlug: slug,
      totalCount: opportunities.length,
      totalImpactEstimate: Number(
        opportunities.reduce((acc, o) => acc + o.estimatedRevenueImpact, 0).toFixed(2)
      ),
      opportunities,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch revenue opportunities', details: error?.message },
      { status: 500 }
    );
  }
}
