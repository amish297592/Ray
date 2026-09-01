import { NextResponse } from 'next/server';
import { z } from 'zod';
import { transitionTransactionState } from '@/lib/resilience/state-machine';
import { createStructuredError } from '@/lib/resilience/error-contract';
import { recordAuditEvent } from '@/lib/ai/audit';

const SimulationSchema = z.object({
  actionId: z.string().min(5),
  scenarioType: z.enum([
    'DUPLICATE_REQUEST',
    'PAYMENT_DECLINE',
    'API_TIMEOUT',
    'SIGNATURE_MISMATCH',
    'LIMIT_EXCEEDED',
    'DAILY_LIMIT_EXCEEDED',
    'PRICE_TAMPERING',
    'AI_OUTAGE',
  ]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parseResult = SimulationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        createStructuredError({
          code: 'INVALID_SIMULATION_PAYLOAD',
          message: 'Invalid developer failure simulation request.',
          recommendedAction: 'PROVIDE_VALID_SCENARIO_TYPE',
        }),
        { status: 400 }
      );
    }

    const { actionId, scenarioType } = parseResult.data;

    // 1. Scenario: DUPLICATE_REQUEST
    if (scenarioType === 'DUPLICATE_REQUEST') {
      const stateTransition = transitionTransactionState('CREATED', 'DUPLICATE_REQUEST');
      await recordAuditEvent({
        actionId,
        actor: 'SYSTEM',
        action: 'DUPLICATE_REQUEST_BLOCKED',
        status: 'SUCCESS',
        reason: 'Developer Failure Simulation: Rapid double click detected. Original action state returned. 0 duplicate orders created.',
        metadata: { idempotentRetry: true, safe: true },
      });

      return NextResponse.json({
        success: true,
        scenarioType,
        status: 'DUPLICATE_REQUEST',
        message: 'Idempotency Protection Active: Rapid second submission recognized. Original transaction returned.',
        originalActionId: actionId,
        moneyCharged: 0,
        safe: true,
        stateTransition,
      });
    }

    // 2. Scenario: PAYMENT_DECLINE
    if (scenarioType === 'PAYMENT_DECLINE') {
      const stateTransition = transitionTransactionState('CHECKOUT_STARTED', 'PAYMENT_FAILED');
      await recordAuditEvent({
        actionId,
        actor: 'SYSTEM',
        action: 'PAYMENT_FAILED',
        status: 'FAILED',
        reason: 'Developer Failure Simulation: Razorpay Test Payment was declined by user/card.',
        metadata: { moneyCharged: 0 },
      });

      return NextResponse.json(
        createStructuredError({
          code: 'PAYMENT_DECLINED',
          message: 'Payment was declined by issuing bank/card. No money was charged.',
          actionId,
          recoverable: true,
          recommendedAction: 'RETRY_WITH_OTHER_PAYMENT_METHOD',
          moneyCharged: 0,
        }),
        { status: 402 }
      );
    }

    // 3. Scenario: API_TIMEOUT
    if (scenarioType === 'API_TIMEOUT') {
      const stateTransition = transitionTransactionState('CHECKOUT_STARTED', 'PAYMENT_TIMEOUT');
      await recordAuditEvent({
        actionId,
        actor: 'SYSTEM',
        action: 'PAYMENT_TIMEOUT',
        status: 'FAILED',
        reason: 'Developer Failure Simulation: Gateway timeout. Status unconfirmed.',
        metadata: { moneyCharged: 0 },
      });

      return NextResponse.json(
        createStructuredError({
          code: 'PAYMENT_TIMEOUT',
          message: 'Payment status could not be confirmed due to gateway timeout. No duplicate order created.',
          actionId,
          recoverable: true,
          recommendedAction: 'CHECK_PAYMENT_STATUS',
          moneyCharged: 0,
        }),
        { status: 504 }
      );
    }

    // 4. Scenario: SIGNATURE_MISMATCH
    if (scenarioType === 'SIGNATURE_MISMATCH') {
      const stateTransition = transitionTransactionState('PAYMENT_RECEIVED', 'SIGNATURE_INVALID');
      await recordAuditEvent({
        actionId,
        actor: 'SYSTEM',
        action: 'SIGNATURE_INVALID',
        status: 'FAILED',
        reason: 'Developer Failure Simulation: HMAC-SHA256 signature mismatch detected on webhook/callback.',
        metadata: { moneyCharged: 0 },
      });

      return NextResponse.json(
        createStructuredError({
          code: 'SIGNATURE_INVALID',
          message: 'Cryptographic payment signature verification failed. Payment rejected.',
          actionId,
          recoverable: false,
          recommendedAction: 'STOP_TRANSACTION_AND_INVESTIGATE',
          moneyCharged: 0,
        }),
        { status: 400 }
      );
    }

    // 5. Scenario: LIMIT_EXCEEDED
    if (scenarioType === 'LIMIT_EXCEEDED') {
      const stateTransition = transitionTransactionState('CREATED', 'LIMIT_EXCEEDED');
      await recordAuditEvent({
        actionId,
        actor: 'SYSTEM',
        action: 'POLICY_REJECTED',
        status: 'BLOCKED',
        reason: 'Developer Failure Simulation: Requested amount ₹5,498 exceeds single limit cap of ₹5,000. Razorpay order NOT created.',
        metadata: { moneyCharged: 0 },
      });

      return NextResponse.json(
        createStructuredError({
          code: 'LIMIT_EXCEEDED',
          message: 'Requested amount ₹5,498 exceeds single transaction limit of ₹5,000. Razorpay order API call prevented.',
          actionId,
          recoverable: true,
          recommendedAction: 'REDUCE_BASKET_AMOUNT',
          moneyCharged: 0,
        }),
        { status: 422 }
      );
    }

    // 6. Scenario: PRICE_TAMPERING
    if (scenarioType === 'PRICE_TAMPERING') {
      await recordAuditEvent({
        actionId,
        actor: 'SYSTEM',
        action: 'PRICE_TAMPERING_BLOCKED',
        status: 'BLOCKED',
        reason: 'Developer Failure Simulation: Client attempted to submit shoe price as ₹1. Server restored canonical DB price ₹3,999.',
        metadata: { clientSuppliedPrice: 1, canonicalDbPrice: 3999 },
      });

      return NextResponse.json({
        success: true,
        scenarioType,
        message: 'Price Tampering Prevented: Client-supplied price ₹1 ignored. Server DB price ₹3,999 enforced.',
        restoredAmount: 3999,
        moneyCharged: 0,
      });
    }

    return NextResponse.json({ success: true, scenarioType });
  } catch (error: any) {
    return NextResponse.json(
      createStructuredError({
        code: 'INTERNAL_SIMULATION_ERROR',
        message: error?.message || 'Failure simulation execution error',
      }),
      { status: 500 }
    );
  }
}
