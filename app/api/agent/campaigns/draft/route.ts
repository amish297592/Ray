import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createCampaignDraft } from '@/lib/ai/tools';
import prisma from '@/lib/prisma';
import { recordAuditEvent } from '@/lib/ai/audit';

const DraftSchema = z.object({
  merchantSlug: z.string().default('nova-run'),
  title: z.string().min(3),
  offerDiscountPercent: z.number().min(1).max(50),
  targetAudience: z.string().min(3),
  durationHours: z.number().positive(),
  expectedRevenueImpact: z.number().positive(),
});

const ApproveSchema = z.object({
  campaignId: z.string(),
  merchantSlug: z.string().default('nova-run'),
  approved: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check if this is an approval action
    if (body.approved !== undefined) {
      const parseApprove = ApproveSchema.safeParse(body);
      if (!parseApprove.success) {
        return NextResponse.json({ success: false, error: 'Invalid approval payload' }, { status: 400 });
      }

      const { campaignId, merchantSlug, approved } = parseApprove.data;
      const status = approved ? 'APPROVED' : 'DRAFT';

      const campaign = await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status,
          approvedAt: approved ? new Date() : null,
        },
      });

      await recordAuditEvent({
        actionId: `RAY-ACT-CAMPAIGN-APP-${Date.now()}`,
        merchantSlug,
        actor: 'MERCHANT',
        action: approved ? 'MERCHANT_APPROVED' : 'MERCHANT_REJECTED',
        status: 'SUCCESS',
        reason: `Merchant ${approved ? 'approved and activated' : 'rejected'} campaign '${campaign.title}'`,
      });

      return NextResponse.json({ success: true, campaign });
    }

    // Create Draft
    const parseDraft = DraftSchema.safeParse(body);
    if (!parseDraft.success) {
      return NextResponse.json({ success: false, error: 'Invalid draft payload' }, { status: 400 });
    }

    const campaign = await createCampaignDraft(parseDraft.data);
    return NextResponse.json({ success: true, campaign });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Campaign Action Failed', details: error?.message }, { status: 500 });
  }
}
