import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const merchants = await prisma.merchant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        currency: true,
        readinessScore: true,
        logoUrl: true,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

    const formatted = merchants.map((m) => ({
      ...m,
      passportEndpoint: baseUrl ? `${baseUrl}/api/agent/merchant/${m.slug}` : `/api/agent/merchant/${m.slug}`,
      isAiCommerceReady: m.readinessScore >= 90,
    }));

    return NextResponse.json({
      success: true,
      count: formatted.length,
      merchants: formatted,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error?.message || 'Failed to list merchants' } },
      { status: 500 }
    );
  }
}
