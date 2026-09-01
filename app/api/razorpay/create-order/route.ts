import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { createRazorpayOrder, isRazorpayConfigured } from '@/lib/razorpay/client';
import { evaluatePolicy } from '@/lib/policy/engine';
import { recordAuditEvent } from '@/lib/ai/audit';

// Input Validation Schema
const CreateOrderSchema = z.object({
  actionId: z.string().min(5, 'Action ID is required'),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
    })
  ).min(1, 'Cart must contain at least one item'),
  merchantSlug: z.string().default('nova-run'),
  userConfirmed: z.boolean().default(false),
  simulateFailureType: z.string().optional(), // Developer failure simulator
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parseResult = CreateOrderSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid order creation payload', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { actionId, items, merchantSlug, userConfirmed, simulateFailureType } = parseResult.data;

    // 1. Load Merchant from DB
    const merchant = await prisma.merchant.findUnique({
      where: { slug: merchantSlug },
    });

    if (!merchant) {
      return NextResponse.json({ success: false, error: 'Merchant not found' }, { status: 404 });
    }

    // 2. SERVER-SIDE Amount & Cart Items Calculation
    const productIds = items.map((i) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (dbProducts.length !== productIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more items in cart are invalid or out of stock' },
        { status: 400 }
      );
    }

    let calculatedTotalAmount = 0;
    const cartSummaryItems = [];

    for (const item of items) {
      const prod = dbProducts.find((p) => p.id === item.productId);
      if (!prod) continue;
      const lineTotal = prod.price * item.quantity;
      calculatedTotalAmount += lineTotal;
      cartSummaryItems.push({
        id: prod.id,
        title: prod.title,
        price: prod.price,
        quantity: item.quantity,
        category: prod.category,
      });
    }

    calculatedTotalAmount = Number(calculatedTotalAmount.toFixed(2));

    // 3. APPLICATION-LEVEL IDEMPOTENCY CHECK
    const existingOrder = await prisma.order.findUnique({
      where: { actionId },
    });

    if (existingOrder && existingOrder.razorpayOrderId) {
      await recordAuditEvent({
        actionId,
        merchantSlug,
        orderId: existingOrder.id,
        actor: 'SYSTEM',
        action: 'DUPLICATE_REQUEST_BLOCKED',
        amount: existingOrder.totalAmount,
        status: 'SUCCESS',
        reason: `Idempotent request recognized. Returning existing Razorpay order ${existingOrder.razorpayOrderId}`,
        metadata: { idempotentRetry: true },
      });

      const publicRazorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '';

      return NextResponse.json({
        success: true,
        idempotentRetry: true,
        orderId: existingOrder.razorpayOrderId,
        amount: existingOrder.totalAmount,
        currency: existingOrder.currency,
        keyId: publicRazorpayKey,
        actionId: existingOrder.actionId,
        message: 'Existing order retrieved cleanly (idempotent request)',
      });
    }

    // 4. CENTRAL DETERMINISTIC POLICY EVALUATION
    const policyDecision = await evaluatePolicy({
      actionId,
      merchantSlug,
      items,
      userConfirmed,
      simulateFailureType,
    });

    // MONEY GATE: If Policy Engine blocks or fails closed -> STOP IMMEDIATELY! Razorpay API is NEVER called!
    if (!policyDecision.allowed || policyDecision.decision === 'BLOCK') {
      await recordAuditEvent({
        actionId,
        merchantSlug,
        actor: 'SYSTEM',
        action: 'RAZORPAY_CALL_BLOCKED',
        amount: calculatedTotalAmount,
        status: 'BLOCKED',
        reason: `Razorpay API call prevented by Policy Engine. Rule: ${policyDecision.rule}. ${policyDecision.reason}`,
      });

      return NextResponse.json(
        {
          success: false,
          error: policyDecision.rule,
          reason: policyDecision.reason,
          moneyCharged: 0,
          policyDecision,
        },
        { status: 422 }
      );
    }

    // 5. VERIFY PERSISTED SERVER AUTHORIZATION RECORD
    const authRecord = await prisma.authorizationRecord.findUnique({
      where: { actionId },
    });

    if (!authRecord || authRecord.status === 'INVALIDATED' || authRecord.status === 'EXPIRED') {
      await recordAuditEvent({
        actionId,
        merchantSlug,
        actor: 'SYSTEM',
        action: 'AUTHORIZATION_INVALIDATED',
        amount: calculatedTotalAmount,
        status: 'BLOCKED',
        reason: 'Order creation rejected: Persisted server authorization record is missing or invalidated.',
      });

      return NextResponse.json(
        {
          success: false,
          error: 'AUTHORIZATION_INVALIDATED',
          reason: 'Explicit user authorization is missing or stale. Fresh authorization is required.',
          moneyCharged: 0,
        },
        { status: 422 }
      );
    }

    // Mark Authorization Record as USED
    await prisma.authorizationRecord.update({
      where: { id: authRecord.id },
      data: { status: 'USED' },
    });

    // 6. CREATE RAZORPAY TEST MODE ORDER
    let razorpayOrderId = '';
    const hasKeys = isRazorpayConfigured();

    if (hasKeys) {
      try {
        const razorpayOrder = await createRazorpayOrder({
          amountInRupees: calculatedTotalAmount,
          currency: 'INR',
          receipt: actionId,
          notes: {
            actionId,
            merchantSlug,
            itemCount: String(items.length),
          },
        });
        razorpayOrderId = razorpayOrder.id;
      } catch (err: any) {
        await recordAuditEvent({
          actionId,
          merchantSlug,
          actor: 'SYSTEM',
          action: 'RAZORPAY_ORDER_FAILED',
          amount: calculatedTotalAmount,
          status: 'FAILED',
          reason: err?.message || 'Razorpay API communication failure',
        });

        return NextResponse.json(
          { success: false, error: 'Razorpay API Order Creation Failed', details: err?.message },
          { status: 502 }
        );
      }
    } else {
      razorpayOrderId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    // 7. PERSIST ORDER IN DATABASE
    const newOrder = await prisma.order.create({
      data: {
        actionId,
        merchantId: merchant.id,
        razorpayOrderId,
        totalAmount: calculatedTotalAmount,
        currency: 'INR',
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        cartItemsJson: JSON.stringify(cartSummaryItems),
      },
    });

    await recordAuditEvent({
      actionId,
      merchantSlug,
      orderId: newOrder.id,
      actor: 'SYSTEM',
      action: 'RAZORPAY_ORDER_CREATED',
      amount: calculatedTotalAmount,
      status: 'SUCCESS',
      reason: `Razorpay Test Mode Order ${razorpayOrderId} created after passing Policy Engine & User Authorization.`,
      metadata: { razorpayOrderId },
    });

    const publicRazorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_test_demo_key_id';

    return NextResponse.json({
      success: true,
      orderId: razorpayOrderId,
      amount: calculatedTotalAmount,
      currency: 'INR',
      keyId: publicRazorpayKey,
      actionId,
      items: cartSummaryItems,
      policyDecision,
    });
  } catch (error: any) {
    console.error('[API create-order Error]:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error', details: error?.message }, { status: 500 });
  }
}
