import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const logs = await prisma.auditEvent.findMany({
      take: 50,
      orderBy: { timestamp: 'desc' },
      include: {
        merchant: {
          select: { name: true, slug: true },
        },
      },
    });

    const totalEvents = await prisma.auditEvent.count();

    return NextResponse.json({
      success: true,
      totalEvents,
      logs: logs.map((log) => ({
        id: log.id,
        actionId: log.actionId,
        actor: log.actor,
        action: log.action,
        amount: log.amount,
        status: log.status,
        reason: log.reason,
        createdAt: log.timestamp ? log.timestamp.toISOString() : new Date().toISOString(),
        merchantName: log.merchant?.name || 'Nova Run',
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit logs', details: error?.message },
      { status: 500 }
    );
  }
}
