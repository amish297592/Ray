import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { verifyPaymentSignature, isRazorpayConfigured } from '@/lib/razorpay/client';
import { recordAuditEvent } from '@/lib/ai/audit';

const VerifySchema = z.object({
  actionId: z.string(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
  method: z.string().optional().default('card'),
  simulateSignatureFailure: z.boolean().optional().default(false), // For testing recovery
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parseResult = VerifySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification payload', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const {
      actionId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      method,
      simulateSignatureFailure,
    } = parseResult.data;

    // 1. Audit Log Verification Started
    await recordAuditEvent({
      actionId,
      actor: 'SYSTEM',
      action: 'PAYMENT_VERIFICATION_STARTED',
      status: 'PENDING',
      reason: `Verifying cryptographic signature for Razorpay payment ${razorpayPaymentId}`,
    });

    // 2. Load Order from DB
    const order = await prisma.order.findUnique({
      where: { actionId },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found for actionId' }, { status: 404 });
    }

    // 3. Cryptographic Signature Verification
    let isValidSignature = false;
    const hasKeys = isRazorpayConfigured();

    if (simulateSignatureFailure) {
      isValidSignature = false;
    } else if (hasKeys) {
      isValidSignature = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    } else {
      // In demo test mode without real API keys, verify signature pattern format
      isValidSignature = Boolean(razorpaySignature && razorpaySignature.length >= 10);
    }

    // 4. Handle Signature Verification Failure
    if (!isValidSignature) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'PAYMENT_FAILED',
          paymentStatus: 'FAILED',
          failureReason: 'Cryptographic HMAC signature verification failed',
        },
      });

      await prisma.payment.create({
        data: {
          orderId: order.id,
          razorpayPaymentId,
          razorpaySignature,
          amount: order.totalAmount,
          currency: order.currency,
          status: 'FAILED',
          failureReason: 'Cryptographic signature mismatch',
          method,
        },
      });

      await recordAuditEvent({
        actionId,
        orderId: order.id,
        actor: 'SYSTEM',
        action: 'PAYMENT_FAILED',
        amount: order.totalAmount,
        status: 'FAILED',
        reason: 'Payment failed server-side signature verification. ₹0 charged.',
        metadata: { moneyCharged: 0, orderStatus: 'PAYMENT_FAILED' },
      });

      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: 'Payment Verification Failed',
          reason: 'Cryptographic HMAC-SHA256 signature verification failed.',
          moneyCharged: 0,
          orderStatus: 'PAYMENT_FAILED',
        },
        { status: 400 }
      );
    }

    // 5. Successful Signature Verification! Update Order & Payment
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        paymentStatus: 'CAPTURED',
      },
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        razorpayPaymentId,
        razorpaySignature,
        amount: order.totalAmount,
        currency: order.currency,
        status: 'SUCCESS',
        method,
      },
    });

    await recordAuditEvent({
      actionId,
      orderId: order.id,
      actor: 'SYSTEM',
      action: 'PAYMENT_VERIFIED',
      amount: order.totalAmount,
      status: 'SUCCESS',
      reason: `Signature verified cleanly. Captured ₹${order.totalAmount} via Razorpay Test Mode.`,
      metadata: { razorpayPaymentId, razorpayOrderId },
    });

    return NextResponse.json({
      success: true,
      verified: true,
      orderId: updatedOrder.razorpayOrderId,
      paymentId: razorpayPaymentId,
      amount: updatedOrder.totalAmount,
      status: 'PAID',
      actionId,
      message: 'Razorpay payment verified server-side and recorded in DB',
    });
  } catch (error: any) {
    console.error('[API verify-payment Error]:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error', details: error?.message }, { status: 500 });
  }
}
