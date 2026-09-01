import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { slug: 'nova-run' },
      include: {
        products: {
          take: 35,
          orderBy: { price: 'asc' },
        },
      },
    });

    if (!merchant) {
      return NextResponse.json({ success: false, error: 'Merchant not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      merchant: {
        name: merchant.name,
        slug: merchant.slug,
        category: merchant.category,
        currency: merchant.currency,
      },
      catalog: {
        totalProducts: merchant.products.length,
        products: merchant.products,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch catalog', details: error?.message }, { status: 500 });
  }
}
