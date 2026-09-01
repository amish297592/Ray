import { NextResponse } from 'next/server';
import { z } from 'zod';
import { evaluatePolicy } from '@/lib/policy/engine';

const PolicyCheckSchema = z.object({
  actionId: z.string().min(5, 'Action ID is required'),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
    })
  ).min(1, 'Cart items required'),
  merchantSlug: z.string().default('nova-run'),
  userConfirmed: z.boolean().optional().default(false),
  actionType: z.enum(['PURCHASE', 'UPSELL', 'CROSS_SELL', 'CAMPAIGN_PURCHASE']).optional().default('PURCHASE'),
  simulateFailureType: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parseResult = PolicyCheckSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          allowed: false,
          decision: 'BLOCK',
          rule: 'INVALID_PAYLOAD',
          reason: 'Invalid request payload supplied to Policy Check API.',
          moneyCharged: 0,
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const decision = await evaluatePolicy(parseResult.data);

    const httpStatus = decision.allowed ? 200 : decision.rule === 'POLICY_UNAVAILABLE' ? 503 : 422;

    return NextResponse.json(decision, { status: httpStatus });
  } catch (error: any) {
    // FAIL-CLOSED BACKUP HANDLER
    return NextResponse.json(
      {
        allowed: false,
        decision: 'BLOCK',
        rule: 'POLICY_UNAVAILABLE',
        reason: 'Fail-Closed Enforcement: Internal server error in policy evaluation. ₹0 charged.',
        moneyCharged: 0,
      },
      { status: 500 }
    );
  }
}
