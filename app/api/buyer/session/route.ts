import { NextResponse } from 'next/server';
import { z } from 'zod';
import { runBuyerSession } from '@/lib/ai/buyer/buyer-agent';

const BuyerSessionSchema = z.object({
  rawQuery: z.string().optional().transform((val) => (val && val.trim().length > 0 ? val.trim() : 'Find top recommended running setup')),
  merchantSlug: z.string().default('nova-run'),
  actionId: z.string().optional(),
  userConfirmed: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }

    const parseResult = BuyerSessionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid buyer request payload', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const session = await runBuyerSession(parseResult.data);

    return NextResponse.json({
      success: true,
      ...session,
    });
  } catch (error: any) {
    console.error('AI Buyer Session API Error:', error);
    return NextResponse.json(
      { success: false, error: 'AI Buyer Session Execution Failed', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
