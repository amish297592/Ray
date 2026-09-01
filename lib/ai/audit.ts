import prisma from '@/lib/prisma';

export interface RecordAuditEventParams {
  actionId: string;
  merchantSlug?: string;
  orderId?: string;
  actor: 'AI_BUYER' | 'RAY_GROWTH_AGENT' | 'MERCHANT' | 'SYSTEM';
  action: string;
  amount?: number;
  status: 'SUCCESS' | 'BLOCKED' | 'FAILED' | 'PENDING';
  reason: string;
  metadata?: Record<string, any>;
}

/**
 * Immutable Audit Event Writer
 */
export async function recordAuditEvent(params: RecordAuditEventParams) {
  try {
    const slug = params.merchantSlug || 'nova-run';
    const merchant = await prisma.merchant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!merchant) return null;

    // Sanitize metadata to strip any sensitive keys if accidentally passed
    const cleanMetadata = { ...params.metadata };
    delete cleanMetadata.RAZORPAY_KEY_SECRET;
    delete cleanMetadata.keySecret;
    delete cleanMetadata.secret;

    const auditEvent = await prisma.auditEvent.create({
      data: {
        actionId: params.actionId,
        merchantId: merchant.id,
        orderId: params.orderId || null,
        actor: params.actor,
        action: params.action,
        amount: params.amount !== undefined ? params.amount : null,
        status: params.status,
        reason: params.reason,
        metadataJson: JSON.stringify(cleanMetadata),
      },
    });

    return auditEvent;
  } catch (error) {
    console.error('[Audit Logger Error] Failed to write event:', error);
    return null;
  }
}
