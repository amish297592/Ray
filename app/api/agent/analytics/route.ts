import { NextResponse } from 'next/server';
import { getRevenueAnalytics } from '@/lib/ai/tools';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('merchantSlug') || 'nova-run';

    const analytics = await getRevenueAnalytics(slug);

    if (!analytics) {
      return NextResponse.json({ success: false, error: 'Analytics not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      merchantSlug: slug,
      analytics,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch analytics', details: error?.message }, { status: 500 });
  }
}
