import { NextResponse } from 'next/server';
import { z } from 'zod';
import { runBuyerSession } from '@/lib/ai/buyer/buyer-agent';

const BuyerSessionSchema = z.object({
  rawQuery: z.string().min(2, 'Query is required'),
  merchantSlug: z.string().default('nova-run'),
  actionId: z.string().optional(),
  userConfirmed: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
    return NextResponse.json(
      { success: false, error: 'AI Buyer Session Execution Failed', details: error?.message },
      { status: 500 }
    );
  }
}
