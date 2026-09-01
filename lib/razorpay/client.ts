import Razorpay from 'razorpay';
import crypto from 'crypto';

/**
 * Server-side Razorpay Service Isolation
 * IMPORTANT SECURITY RULE: This module runs ONLY on the server.
 * RAZORPAY_KEY_SECRET is NEVER sent to the browser or logged.
 */

// Helper to check if credentials are configured
export function isRazorpayConfigured(): boolean {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  return Boolean(keyId && keySecret && keyId !== 'rzp_test_demo_key_id');
}

// Get Razorpay SDK Instance
export function getRazorpayClient(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay configuration missing. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in process.env.');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export interface CreateOrderParams {
  amountInRupees: number;
  currency?: string;
  receipt: string; // Used as actionId
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

/**
 * Creates a server-side Razorpay Test Mode Order.
 * Converts amount from INR Rupees to Paise (multiply by 100).
 */
export async function createRazorpayOrder(params: CreateOrderParams): Promise<RazorpayOrderResult> {
  const razorpay = getRazorpayClient();
  
  // Amount in Paise (e.g. ₹4,498 -> 449800 paise)
  const amountInPaise = Math.round(params.amountInRupees * 100);

  const options = {
    amount: amountInPaise,
    currency: params.currency || 'INR',
    receipt: params.receipt,
    notes: {
      merchant: 'Nova Run',
      system: 'RAY Autonomous Yield',
      ...params.notes,
    },
  };

  try {
    const order = await razorpay.orders.create(options);
    return order as unknown as RazorpayOrderResult;
  } catch (error: any) {
    console.error('[Razorpay Service Error] Order creation failed:', error?.error?.description || error?.message || error);
    throw new Error(`Razorpay Order Creation Failed: ${error?.error?.description || error?.message || 'API Error'}`);
  }
}

/**
 * Verifies Razorpay payment signature using HMAC-SHA256 algorithm.
 * Official Razorpay Documentation Algorithm:
 * hmac_sha256(order_id + "|" + payment_id, secret) == signature
 */
export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    throw new Error('RAZORPAY_KEY_SECRET is missing from environment variables.');
  }

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return false;
  }

  try {
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    // Timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(razorpaySignature, 'utf-8')
    );
  } catch (err) {
    return false;
  }
}
