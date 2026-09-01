import { NextResponse } from 'next/server';
import { generateAICommercePassport } from '@/lib/ai/passport';
import { recordAuditEvent } from '@/lib/ai/audit';

export async function GET(
  request: Request,
  { params }: { params: { merchantSlug: string } }
) {
  try {
    const slug = params.merchantSlug || 'nova-run';
    const passport = await generateAICommercePassport(slug);

    await recordAuditEvent({
      actionId: `RAY-ACT-PASSPORT-${Date.now()}`,
      merchantSlug: slug,
      actor: 'SYSTEM',
      action: 'PASSPORT_REQUESTED',
      status: 'SUCCESS',
      reason: `Machine-readable AI Commerce Passport requested and generated for merchant '${slug}'`,
    });

    // CORS & Machine Access Headers for read-only discovery
    return NextResponse.json(passport, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: 'MERCHANT_NOT_FOUND',
          message: error?.message || `Merchant '${params.merchantSlug}' does not exist or has no active profile.`,
        },
      },
      { status: 404 }
    );
  }
}
