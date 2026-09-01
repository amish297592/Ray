import prisma from '@/lib/prisma';

export interface PolicyCheckRequest {
  merchantSlug: string;
  amount: number;
  category: string;
  userConfirmed: boolean;
}

export interface PolicyCheckResult {
  allowed: boolean;
  reason: string;
  policy: {
    maxTransactionLimit: number;
    maxDailySpend: number;
    requireUserConfirmation: boolean;
    allowedCategories: string[];
    blockedCategories: string[];
  };
}

/**
 * Deterministic Policy Guardrails Engine
 * Note: The LLM NEVER decides financial authorization.
 * The backend Policy Engine validates all money actions against hard rules.
 */
export async function validateFinancialPolicy(
  req: PolicyCheckRequest
): Promise<PolicyCheckResult> {
  // 1. Fetch active merchant policy
  const merchant = await prisma.merchant.findUnique({
    where: { slug: req.merchantSlug },
    include: { policies: true },
  });

  if (!merchant || merchant.policies.length === 0) {
    return {
      allowed: false,
      reason: 'Merchant policy configuration not found.',
      policy: {
        maxTransactionLimit: 5000,
        maxDailySpend: 20000,
        requireUserConfirmation: true,
        allowedCategories: [],
        blockedCategories: [],
      },
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

  const policySummary = {
    maxTransactionLimit: policy.maxTransactionLimit,
    maxDailySpend: policy.maxDailySpend,
    requireUserConfirmation: policy.requireUserConfirmation,
    allowedCategories,
    blockedCategories,
  };

  // Rule 1: Policy Enabled Check
  if (!policy.isEnabled) {
    return {
      allowed: false,
      reason: 'Merchant policy engine is currently disabled by admin.',
      policy: policySummary,
    };
  }

  // Rule 2: Explicit User Confirmation Required
  if (policy.requireUserConfirmation && !req.userConfirmed) {
    return {
      allowed: false,
      reason: 'Policy Violation: Explicit user spending authorization is required before initiating payment.',
      policy: policySummary,
    };
  }

  // Rule 3: Single Transaction Spending Limit
  if (req.amount > policy.maxTransactionLimit) {
    return {
      allowed: false,
      reason: `Policy Violation: Requested amount (₹${req.amount.toLocaleString()}) exceeds maximum allowed transaction limit of ₹${policy.maxTransactionLimit.toLocaleString()}.`,
      policy: policySummary,
    };
  }

  // Rule 4: Category Restrictions
  if (blockedCategories.some((cat) => cat.toLowerCase() === req.category.toLowerCase())) {
    return {
      allowed: false,
      reason: `Policy Violation: Category '${req.category}' is explicitly blocked by merchant rules.`,
      policy: policySummary,
    };
  }

  // Rule 5: Calculate 24-Hour Daily Cumulative Spend
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentOrders = await prisma.order.aggregate({
    where: {
      merchantId: merchant.id,
      status: 'PAID',
      createdAt: { gte: twentyFourHoursAgo },
    },
    _sum: {
      totalAmount: true,
    },
  });

  const currentDailySpend = recentOrders._sum.totalAmount || 0;
  if (currentDailySpend + req.amount > policy.maxDailySpend) {
    return {
      allowed: false,
      reason: `Policy Violation: Cumulative daily spend (₹${(currentDailySpend + req.amount).toLocaleString()}) would exceed maximum daily cap of ₹${policy.maxDailySpend.toLocaleString()}.`,
      policy: policySummary,
    };
  }

  // All Policy Checks Passed!
  return {
    allowed: true,
    reason: `Policy Check PASSED: Amount ₹${req.amount.toLocaleString()} is within transaction cap (₹${policy.maxTransactionLimit.toLocaleString()}) and category '${req.category}' is permitted.`,
    policy: policySummary,
  };
}
