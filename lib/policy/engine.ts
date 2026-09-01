import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { recordAuditEvent } from '@/lib/ai/audit';

export interface CartItemInput {
  productId: string;
  quantity: number;
}

export interface PolicyEvaluationRequest {
  actionId: string;
  merchantSlug: string;
  items: CartItemInput[];
  userConfirmed?: boolean;
  actionType?: 'PURCHASE' | 'UPSELL' | 'CROSS_SELL' | 'CAMPAIGN_PURCHASE';
  simulateFailureType?: string;
}

export interface PolicyDecision {
  allowed: boolean;
  decision: 'ALLOW' | 'BLOCK' | 'REQUIRES_AUTHORIZATION';
  rule: string;
  reason: string;
  moneyCharged: number;
  calculatedAmount: number;
  limits: {
    maxTransactionLimit: number;
    maxDailySpend: number;
    currentDailySpend: number;
    remainingDailySpend: number;
    allowedCategories: string[];
    blockedCategories: string[];
    requireUserConfirmation: boolean;
  };
  authorizationToken?: string;
  cartHash?: string;
}

/**
 * Computes a SHA-256 cart hash for tamper protection
 */
export function computeCartHash(items: { productId: string; price: number; quantity: number }[]): string {
  const sorted = [...items].sort((a, b) => a.productId.localeCompare(b.productId));
  const payload = sorted.map((i) => `${i.productId}:${i.price}:${i.quantity}`).join('|');
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Central Server-Authoritative Deterministic Policy Engine
 * Principle: The AI recommends/requests -> Policy Engine Decides -> User Authorizes -> Razorpay Executes
 */
export async function evaluatePolicy(
  req: PolicyEvaluationRequest
): Promise<PolicyDecision> {
  // Default limits structure for fail-closed fallback
  const fallbackLimits = {
    maxTransactionLimit: 5000.0,
    maxDailySpend: 20000.0,
    currentDailySpend: 0.0,
    remainingDailySpend: 20000.0,
    allowedCategories: [],
    blockedCategories: [],
    requireUserConfirmation: true,
  };

  try {
    // 1. FAIL-CLOSED SIMULATION CHECK
    if (req.simulateFailureType === 'SERVICE_UNAVAILABLE') {
      await recordAuditEvent({
        actionId: req.actionId,
        merchantSlug: req.merchantSlug,
        actor: 'SYSTEM',
        action: 'POLICY_UNAVAILABLE',
        status: 'FAILED',
        reason: 'Fail-Closed Enforcement: Policy Engine service unavailable. Razorpay call blocked.',
      });

      return {
        allowed: false,
        decision: 'BLOCK',
        rule: 'POLICY_UNAVAILABLE',
        reason: 'Fail-Closed Enforcement: Policy engine service was unavailable. ₹0 charged.',
        moneyCharged: 0,
        calculatedAmount: 0,
        limits: fallbackLimits,
      };
    }

    // 2. Load Merchant & Policy from Database
    const merchant = await prisma.merchant.findUnique({
      where: { slug: req.merchantSlug || 'nova-run' },
      include: { policies: true },
    });

    if (!merchant || merchant.policies.length === 0) {
      return {
        allowed: false,
        decision: 'BLOCK',
        rule: 'POLICY_CONFIG_NOT_FOUND',
        reason: 'Fail-Closed Enforcement: Merchant policy configuration missing in database.',
        moneyCharged: 0,
        calculatedAmount: 0,
        limits: fallbackLimits,
      };
    }

    const policy = merchant.policies[0];

    let allowedCategories: string[] = [];
    let blockedCategories: string[] = [];

    try {
      allowedCategories = JSON.parse(policy.allowedCategoriesJson || '[]');
      blockedCategories = JSON.parse(policy.blockedCategoriesJson || '[]');
    } catch (e) {
      allowedCategories = ['Footwear', 'Apparel', 'Accessories', 'Electronics', 'Nutrition', 'Sports & Fitness'];
    }

    // 3. SERVER-SIDE Amount & Cart Hash Calculation
    const productIds = req.items.map((i) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (dbProducts.length !== productIds.length) {
      return {
        allowed: false,
        decision: 'BLOCK',
        rule: 'INVALID_PRODUCT_SELECTION',
        reason: 'Policy Violation: One or more selected items do not exist in the merchant catalog.',
        moneyCharged: 0,
        calculatedAmount: 0,
        limits: fallbackLimits,
      };
    }

    let calculatedTotalAmount = 0;
    const cartSummary = [];
    let primaryCategory = dbProducts[0]?.category || 'Sports & Fitness';

    for (const item of req.items) {
      const prod = dbProducts.find((p) => p.id === item.productId);
      if (!prod) continue;
      const lineTotal = prod.price * item.quantity;
      calculatedTotalAmount += lineTotal;
      cartSummary.push({
        productId: prod.id,
        title: prod.title,
        price: prod.price,
        quantity: item.quantity,
        category: prod.category,
      });
    }

    calculatedTotalAmount = Number(calculatedTotalAmount.toFixed(2));
    const cartHash = computeCartHash(cartSummary);

    // 4. Calculate 24-Hour Cumulative Daily Spend
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentPaidOrders = await prisma.order.aggregate({
      where: {
        merchantId: merchant.id,
        status: 'PAID',
        createdAt: { gte: twentyFourHoursAgo },
      },
      _sum: {
        totalAmount: true,
      },
    });

    const currentDailySpend = recentPaidOrders._sum.totalAmount || 0;
    const remainingDailySpend = Math.max(0, policy.maxDailySpend - currentDailySpend);

    const limitsSummary = {
      maxTransactionLimit: policy.maxTransactionLimit,
      maxDailySpend: policy.maxDailySpend,
      currentDailySpend,
      remainingDailySpend,
      allowedCategories,
      blockedCategories,
      requireUserConfirmation: policy.requireUserConfirmation,
    };

    // 5. DEVELOPER FAILURE SIMULATIONS
    if (req.simulateFailureType === 'LIMIT_EXCEEDED') {
      const testAmount = 5499.0;
      await recordAuditEvent({
        actionId: req.actionId,
        merchantSlug: req.merchantSlug,
        actor: 'SYSTEM',
        action: 'POLICY_BLOCKED',
        amount: testAmount,
        status: 'BLOCKED',
        reason: `TRANSACTION_LIMIT_EXCEEDED: Requested ₹${testAmount} exceeds cap ₹${policy.maxTransactionLimit}`,
      });

      return {
        allowed: false,
        decision: 'BLOCK',
        rule: 'TRANSACTION_LIMIT_EXCEEDED',
        reason: `Policy Rejection: Requested amount (₹${testAmount.toLocaleString()}) exceeds single transaction limit of ₹${policy.maxTransactionLimit.toLocaleString()}.`,
        moneyCharged: 0,
        calculatedAmount: testAmount,
        limits: limitsSummary,
      };
    }

    if (req.simulateFailureType === 'DAILY_LIMIT_EXCEEDED') {
      await recordAuditEvent({
        actionId: req.actionId,
        merchantSlug: req.merchantSlug,
        actor: 'SYSTEM',
        action: 'POLICY_BLOCKED',
        amount: calculatedTotalAmount,
        status: 'BLOCKED',
        reason: `DAILY_LIMIT_EXCEEDED: Cumulative spend would exceed ₹${policy.maxDailySpend}`,
      });

      return {
        allowed: false,
        decision: 'BLOCK',
        rule: 'DAILY_LIMIT_EXCEEDED',
        reason: `Policy Rejection: Cumulative 24-hour spend would exceed maximum daily cap of ₹${policy.maxDailySpend.toLocaleString()}.`,
        moneyCharged: 0,
        calculatedAmount: calculatedTotalAmount,
        limits: limitsSummary,
      };
    }

    if (req.simulateFailureType === 'CATEGORY_PROHIBITED') {
      const blockedCat = 'Gift Cards';
      await recordAuditEvent({
        actionId: req.actionId,
        merchantSlug: req.merchantSlug,
        actor: 'SYSTEM',
        action: 'POLICY_BLOCKED',
        amount: calculatedTotalAmount,
        status: 'BLOCKED',
        reason: `CATEGORY_NOT_PERMITTED: Category '${blockedCat}' is explicitly prohibited.`,
      });

      return {
        allowed: false,
        decision: 'BLOCK',
        rule: 'CATEGORY_NOT_PERMITTED',
        reason: `Policy Rejection: Category '${blockedCat}' is explicitly prohibited by merchant guardrail rules.`,
        moneyCharged: 0,
        calculatedAmount: calculatedTotalAmount,
        limits: limitsSummary,
      };
    }

    // 5.5 STALE AUTHORIZATION CHECK (Priority Cart Tampering Detection)
    const existingAuth = await prisma.authorizationRecord.findUnique({
      where: { actionId: req.actionId },
    });

    if (existingAuth) {
      if (existingAuth.cartHash !== cartHash || existingAuth.authorizedAmount !== calculatedTotalAmount) {
        await prisma.authorizationRecord.update({
          where: { id: existingAuth.id },
          data: { status: 'INVALIDATED' },
        });

        await recordAuditEvent({
          actionId: req.actionId,
          merchantSlug: req.merchantSlug,
          actor: 'SYSTEM',
          action: 'AUTHORIZATION_INVALIDATED',
          amount: calculatedTotalAmount,
          status: 'BLOCKED',
          reason: `Stale Authorization: Cart changed from ₹${existingAuth.authorizedAmount} to ₹${calculatedTotalAmount}. Authorization invalidated.`,
        });

        return {
          allowed: false,
          decision: 'BLOCK',
          rule: 'STALE_AUTHORIZATION',
          reason: 'Security Warning: Cart contents or total amount changed after authorization. Fresh user authorization required.',
          moneyCharged: 0,
          calculatedAmount: calculatedTotalAmount,
          limits: limitsSummary,
        };
      }
    }

    // 6. RULE EVALUATIONS

    // Rule A: Single Transaction Limit
    if (calculatedTotalAmount > policy.maxTransactionLimit) {
      await recordAuditEvent({
        actionId: req.actionId,
        merchantSlug: req.merchantSlug,
        actor: 'SYSTEM',
        action: 'POLICY_BLOCKED',
        amount: calculatedTotalAmount,
        status: 'BLOCKED',
        reason: `TRANSACTION_LIMIT_EXCEEDED: Amount ₹${calculatedTotalAmount} exceeds cap ₹${policy.maxTransactionLimit}`,
      });

      return {
        allowed: false,
        decision: 'BLOCK',
        rule: 'TRANSACTION_LIMIT_EXCEEDED',
        reason: `Policy Rejection: Cart total (₹${calculatedTotalAmount.toLocaleString()}) exceeds maximum allowed transaction limit of ₹${policy.maxTransactionLimit.toLocaleString()}.`,
        moneyCharged: 0,
        calculatedAmount: calculatedTotalAmount,
        limits: limitsSummary,
      };
    }

    // Rule B: Daily Spend Limit
    if (currentDailySpend + calculatedTotalAmount > policy.maxDailySpend) {
      await recordAuditEvent({
        actionId: req.actionId,
        merchantSlug: req.merchantSlug,
        actor: 'SYSTEM',
        action: 'POLICY_BLOCKED',
        amount: calculatedTotalAmount,
        status: 'BLOCKED',
        reason: `DAILY_LIMIT_EXCEEDED: Daily spend ₹${currentDailySpend + calculatedTotalAmount} exceeds cap ₹${policy.maxDailySpend}`,
      });

      return {
        allowed: false,
        decision: 'BLOCK',
        rule: 'DAILY_LIMIT_EXCEEDED',
        reason: `Policy Rejection: Cumulative 24-hour spend (₹${(currentDailySpend + calculatedTotalAmount).toLocaleString()}) would exceed maximum daily limit of ₹${policy.maxDailySpend.toLocaleString()}.`,
        moneyCharged: 0,
        calculatedAmount: calculatedTotalAmount,
        limits: limitsSummary,
      };
    }

    // Rule C: Category Permission Check
    const isProhibitedCategory = blockedCategories.some(
      (cat) => cat.toLowerCase() === primaryCategory.toLowerCase()
    );

    if (isProhibitedCategory) {
      await recordAuditEvent({
        actionId: req.actionId,
        merchantSlug: req.merchantSlug,
        actor: 'SYSTEM',
        action: 'POLICY_BLOCKED',
        amount: calculatedTotalAmount,
        status: 'BLOCKED',
        reason: `CATEGORY_NOT_PERMITTED: Category '${primaryCategory}' is blocked.`,
      });

      return {
        allowed: false,
        decision: 'BLOCK',
        rule: 'CATEGORY_NOT_PERMITTED',
        reason: `Policy Rejection: Category '${primaryCategory}' is explicitly blocked by merchant policies.`,
        moneyCharged: 0,
        calculatedAmount: calculatedTotalAmount,
        limits: limitsSummary,
      };
    }

    // Rule D: Persisted Explicit User Authorization Verification
    if (policy.requireUserConfirmation && !req.userConfirmed) {
      await recordAuditEvent({
        actionId: req.actionId,
        merchantSlug: req.merchantSlug,
        actor: 'SYSTEM',
        action: 'USER_AUTHORIZATION_REQUESTED',
        amount: calculatedTotalAmount,
        status: 'PENDING',
        reason: 'Policy Evaluation: Within limits, waiting for explicit user spending authorization.',
      });

      return {
        allowed: true,
        decision: 'REQUIRES_AUTHORIZATION',
        rule: 'REQUIRES_USER_AUTHORIZATION',
        reason: `Policy Evaluated: Cart total ₹${calculatedTotalAmount.toLocaleString()} is within policy limits. Explicit user authorization required to proceed.`,
        moneyCharged: 0,
        calculatedAmount: calculatedTotalAmount,
        limits: limitsSummary,
      };
    }

    // 7. Persist Authorization Record if not already created
    if (!existingAuth) {
      await prisma.authorizationRecord.create({
        data: {
          actionId: req.actionId,
          merchantId: merchant.id,
          authorizedAmount: calculatedTotalAmount,
          currency: 'INR',
          cartHash,
          cartItemsJson: JSON.stringify(cartSummary),
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes expiration
        },
      });
    }

    await recordAuditEvent({
      actionId: req.actionId,
      merchantSlug: req.merchantSlug,
      actor: 'SYSTEM',
      action: 'POLICY_ALLOWED',
      amount: calculatedTotalAmount,
      status: 'SUCCESS',
      reason: `Policy Check ALLOWED: Cart total ₹${calculatedTotalAmount} authorized and ready for Razorpay payment.`,
    });

    return {
      allowed: true,
      decision: 'ALLOW',
      rule: 'POLICY_PASSED',
      reason: `Policy Check PASSED: Amount ₹${calculatedTotalAmount.toLocaleString()} is authorized and within limits.`,
      moneyCharged: 0,
      calculatedAmount: calculatedTotalAmount,
      limits: limitsSummary,
      cartHash,
    };
  } catch (error: any) {
    // FAIL-CLOSED EXCEPTION HANDLING
    console.error('[Policy Engine Critical Failure]:', error);
    await recordAuditEvent({
      actionId: req.actionId,
      merchantSlug: req.merchantSlug,
      actor: 'SYSTEM',
      action: 'POLICY_UNAVAILABLE',
      status: 'FAILED',
      reason: `Fail-Closed Guardrail Triggered: ${error?.message || 'Policy evaluation exception'}`,
    });

    return {
      allowed: false,
      decision: 'BLOCK',
      rule: 'POLICY_UNAVAILABLE',
      reason: 'Fail-Closed Enforcement: Policy engine error occurred. Transaction automatically blocked. ₹0 charged.',
      moneyCharged: 0,
      calculatedAmount: 0,
      limits: fallbackLimits,
    };
  }
}
