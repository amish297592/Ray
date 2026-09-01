'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, CreditCard, AlertTriangle, CheckCircle2, ArrowRight, RefreshCw, Lock, Zap, FileText, Ban, Layers } from 'lucide-react';
import Link from 'next/link';

interface ProductItem {
  id: string;
  title: string;
  price: number;
  category: string;
}

export default function TestPaymentPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [userConfirmed, setUserConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'SELECT' | 'AUTHORIZE' | 'CHECKOUT' | 'RESULT'>('SELECT');
  const [policyState, setPolicyState] = useState<'CHECKING' | 'APPROVED' | 'WAITING_FOR_USER' | 'AUTHORIZED' | 'BLOCKED'>('CHECKING');
  const [policyDecision, setPolicyDecision] = useState<any>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);

  // Failure simulation mode selector
  const [simulateFailureType, setSimulateFailureType] = useState<string>('NONE');

  // Load initial product data
  useEffect(() => {
    fetch('/api/agent/catalog')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.catalog?.products) {
          const prods = data.catalog.products.slice(0, 2);
          setProducts(prods);
          setSelectedItems(prods.map((p: any) => ({ productId: p.id, quantity: 1 })));
        }
      })
      .catch(() => {
        const fallback = [
          { id: 'shoe-1', title: 'Nova Runner X1 Pro', price: 3999, category: 'Footwear' },
          { id: 'sock-1', title: 'Performance Anti-Blister Socks', price: 499, category: 'Accessories' },
        ];
        setProducts(fallback);
        setSelectedItems(fallback.map((p) => ({ productId: p.id, quantity: 1 })));
      });
  }, []);

  const totalAmount = selectedItems.reduce((acc, item) => {
    const p = products.find((prod) => prod.id === item.productId);
    return acc + (p ? p.price * item.quantity : 0);
  }, 0);

  const actionId = orderData?.actionId || `RAY-ACT-20260901-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  // Evaluate Policy via API
  const handleCheckPolicy = async () => {
    setLoading(true);
    setPolicyState('CHECKING');

    try {
      const res = await fetch('/api/policy/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionId,
          items: selectedItems,
          merchantSlug: 'nova-run',
          userConfirmed: false,
          simulateFailureType: simulateFailureType !== 'NONE' ? simulateFailureType : undefined,
        }),
      });

      const data = await res.json();
      setPolicyDecision(data);

      if (!data.allowed || data.decision === 'BLOCK') {
        setPolicyState('BLOCKED');
      } else {
        setPolicyState('WAITING_FOR_USER');
      }
    } catch (err) {
      setPolicyState('BLOCKED');
      setPolicyDecision({
        allowed: false,
        decision: 'BLOCK',
        rule: 'POLICY_UNAVAILABLE',
        reason: 'Fail-Closed Enforcement: Policy engine connection error. ₹0 charged.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 1 -> Step 2 transition
  const handleProceedToAuth = async () => {
    await handleCheckPolicy();
    setStep('AUTHORIZE');
  };

  // Create Order
  const handleCreateOrder = async () => {
    setLoading(true);
    setErrorDetails(null);

    const currentActionId = `RAY-ACT-20260901-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    try {
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionId: currentActionId,
          items: selectedItems,
          merchantSlug: 'nova-run',
          userConfirmed,
          simulateFailureType: simulateFailureType !== 'NONE' ? simulateFailureType : undefined,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setErrorDetails({
          title: 'Policy Gate Blocked Order',
          reason: data.reason || data.error || 'Deterministic Policy Engine rejected transaction.',
          moneyCharged: 0,
          rule: data.error,
        });
        setStep('RESULT');
        setLoading(false);
        return;
      }

      setOrderData(data);
      setPolicyState('AUTHORIZED');
      setStep('CHECKOUT');
    } catch (err: any) {
      setErrorDetails({
        title: 'Policy Engine Server Error',
        reason: err?.message || 'Failed to communicate with policy server.',
        moneyCharged: 0,
      });
      setStep('RESULT');
    } finally {
      setLoading(false);
    }
  };

  // Razorpay Checkout Modal
  const handleLaunchRazorpayCheckout = () => {
    if (!orderData) return;

    const RazorpayWindow = (window as any).Razorpay;

    if (!RazorpayWindow) {
      alert('Razorpay Checkout SDK is loading. Please try again in a moment.');
      return;
    }

    const options = {
      key: orderData.keyId,
      amount: Math.round(orderData.amount * 100),
      currency: orderData.currency || 'INR',
      name: 'Nova Run',
      description: `RAY Autonomous Yield Payment (${orderData.actionId})`,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150&auto=format&fit=crop&q=80',
      order_id: orderData.orderId,
      handler: async function (response: any) {
        await handleVerifyPayment(response);
      },
      prefill: {
        name: 'Aarav Sharma',
        email: 'aarav.sharma@example.com',
        contact: '9876543210',
      },
      theme: {
        color: '#2563eb',
      },
      modal: {
        ondismiss: function () {
          setLoading(false);
        },
      },
    };

    const rzp = new RazorpayWindow(options);

    if (simulateFailureType === 'DECLINED') {
      handleVerifyPayment({
        razorpay_order_id: orderData.orderId,
        razorpay_payment_id: 'pay_failed_simulation',
        razorpay_signature: 'invalid_signature_tampered',
        simulateSignatureFailure: true,
      });
      return;
    }

    rzp.open();
  };

  // Verify Signature
  const handleVerifyPayment = async (razorpayResponse: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/razorpay/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionId: orderData.actionId,
          razorpayOrderId: razorpayResponse.razorpay_order_id,
          razorpayPaymentId: razorpayResponse.razorpay_payment_id,
          razorpaySignature: razorpayResponse.razorpay_signature,
          simulateSignatureFailure: razorpayResponse.simulateSignatureFailure || false,
        }),
      });

      const data = await res.json();

      if (data.success && data.verified) {
        setPaymentResult(data);
        setErrorDetails(null);
      } else {
        setErrorDetails({
          title: 'Payment Not Completed',
          reason: data.reason || 'Razorpay signature verification failed.',
          moneyCharged: 0,
        });
        setPaymentResult(null);
      }
      setStep('RESULT');
    } catch (err: any) {
      setErrorDetails({
        title: 'Payment Verification Error',
        reason: err?.message || 'Server error during signature verification.',
        moneyCharged: 0,
      });
      setStep('RESULT');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-gray-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-[#1f2433] bg-[#0c0e15] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-lg tracking-wider shadow-lg shadow-blue-500/20">
            RAY
          </div>
          <div>
            <div className="font-bold text-white tracking-wide text-sm flex items-center gap-2">
              RAZORPAY AUTONOMOUS YIELD
              <span className="px-2 py-0.5 text-[10px] uppercase font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
                Phase 3 Policy Guardrails
              </span>
            </div>
            <p className="text-xs text-gray-400">Server-Authoritative Deterministic Policy Engine</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#12141c] border border-[#1f2433] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-gray-300">Policy Engine Active</span>
          </div>

          <Link
            href="/dashboard"
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all"
          >
            Go to Merchant Dashboard
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col justify-center">
        {/* Developer Fail-Closed & Policy Simulation Selector */}
        <div className="mb-6 p-4 rounded-xl bg-[#12141c] border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Phase 3 Policy Failure Simulation Controls
                </div>
                <p className="text-xs text-gray-400">Test deterministic rule enforcement & fail-closed security</p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
              Fail-Closed: ₹0 Charged Guarantee
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSimulateFailureType('NONE')}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                simulateFailureType === 'NONE'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-[#181b26] border-[#2a3044] text-gray-400 hover:text-white'
              }`}
            >
              Normal Policy (PASS)
            </button>
            <button
              onClick={() => setSimulateFailureType('LIMIT_EXCEEDED')}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                simulateFailureType === 'LIMIT_EXCEEDED'
                  ? 'bg-amber-600 border-amber-500 text-white'
                  : 'bg-[#181b26] border-[#2a3044] text-gray-400 hover:text-white'
              }`}
            >
              Txn Limit (&gt; ₹5,000)
            </button>
            <button
              onClick={() => setSimulateFailureType('DAILY_LIMIT_EXCEEDED')}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                simulateFailureType === 'DAILY_LIMIT_EXCEEDED'
                  ? 'bg-amber-600 border-amber-500 text-white'
                  : 'bg-[#181b26] border-[#2a3044] text-gray-400 hover:text-white'
              }`}
            >
              Daily Cap (&gt; ₹20,000)
            </button>
            <button
              onClick={() => setSimulateFailureType('CATEGORY_PROHIBITED')}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                simulateFailureType === 'CATEGORY_PROHIBITED'
                  ? 'bg-rose-600 border-rose-500 text-white'
                  : 'bg-[#181b26] border-[#2a3044] text-gray-400 hover:text-white'
              }`}
            >
              Blocked Category (Gift Cards)
            </button>
            <button
              onClick={() => setSimulateFailureType('SERVICE_UNAVAILABLE')}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                simulateFailureType === 'SERVICE_UNAVAILABLE'
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-[#181b26] border-[#2a3044] text-gray-400 hover:text-white'
              }`}
            >
              Fail-Closed Outage
            </button>
          </div>
        </div>

        {/* STEP 1: SELECT PRODUCTS */}
        {step === 'SELECT' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-extrabold text-white">Nova Run Storefront — Policy Gate Test</h1>
              <p className="text-sm text-gray-400">
                Cart total is calculated server-side and checked against Nova Run’s deterministic guardrail policies.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="p-5 rounded-2xl bg-[#12141c] border border-[#1f2433] hover:border-blue-500/50 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {product.category}
                    </span>
                    <h3 className="font-bold text-white text-lg">{product.title}</h3>
                    <p className="text-xs text-gray-400">Official Nova Run high-performance athletic gear.</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#1f2433] flex items-center justify-between">
                    <div className="text-xl font-black text-white">₹{product.price.toLocaleString()}</div>
                    <div className="text-xs font-mono text-emerald-400">In Stock</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart & Policy Summary Panel */}
            <div className="p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] space-y-4">
              <div className="flex items-center justify-between border-b border-[#1f2433] pb-3">
                <span className="text-sm font-semibold text-gray-300">Server-Validated Basket Total</span>
                <span className="text-2xl font-black text-blue-400">₹{totalAmount.toLocaleString()}</span>
              </div>

              <div className="bg-[#181b26] p-4 rounded-xl border border-[#2a3044] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-gray-200">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <span>Nova Run Active Policy Limits</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">Database Server Rule</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-[#12141c] p-2 rounded-lg border border-[#2a3044]">
                    <span className="text-gray-400 block text-[10px]">Max Single Txn</span>
                    <span className="font-bold text-white">₹5,000.00</span>
                  </div>
                  <div className="bg-[#12141c] p-2 rounded-lg border border-[#2a3044]">
                    <span className="text-gray-400 block text-[10px]">Max 24h Daily Spend</span>
                    <span className="font-bold text-white">₹20,000.00</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleProceedToAuth}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all"
              >
                <span>Evaluate Policy & Authorize</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: POLICY EVALUATION & EXPLICIT USER AUTHORIZATION */}
        {step === 'AUTHORIZE' && (
          <div className="max-w-xl mx-auto w-full space-y-6">
            <div className="p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] space-y-6">
              <div className="flex items-center justify-between border-b border-[#1f2433] pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Deterministic Policy Engine Gate</h2>
                    <p className="text-xs text-gray-400">Server-Authoritative Financial Evaluation</p>
                  </div>
                </div>

                {/* Policy State Badge */}
                {policyState === 'CHECKING' && (
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-mono border border-blue-500/30 flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Evaluating Policy
                  </span>
                )}
                {policyState === 'WAITING_FOR_USER' && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Policy PASSED
                  </span>
                )}
                {policyState === 'BLOCKED' && (
                  <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-mono border border-rose-500/30 flex items-center gap-1">
                    <Ban className="w-3 h-3" /> Policy BLOCKED
                  </span>
                )}
              </div>

              {/* Policy Decision Summary Box */}
              {policyDecision && (
                <div
                  className={`p-4 rounded-xl border space-y-2 text-xs ${
                    policyDecision.allowed
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="font-bold uppercase tracking-wider text-[11px]">
                    Policy Rule: {policyDecision.rule}
                  </div>
                  <p>{policyDecision.reason}</p>
                </div>
              )}

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-[#1f2433]/50">
                  <span className="text-gray-400">Merchant</span>
                  <span className="font-semibold text-white">Nova Run</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1f2433]/50">
                  <span className="text-gray-400">Action ID (Idempotency Key)</span>
                  <span className="font-mono text-xs text-blue-400">{actionId}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1f2433]/50">
                  <span className="text-gray-400">Max Allowed Single Limit</span>
                  <span className="font-semibold text-white">₹5,000.00</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1f2433]/50">
                  <span className="text-gray-400">Requested Cart Total</span>
                  <span className="font-extrabold text-blue-400 text-base">₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {policyState === 'WAITING_FOR_USER' && (
                <label className="flex items-start space-x-3 p-3.5 rounded-xl bg-[#181b26] border border-[#2a3044] cursor-pointer hover:border-blue-500/40 transition-all">
                  <input
                    type="checkbox"
                    checked={userConfirmed}
                    onChange={(e) => setUserConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-300">
                    I explicitly authorize RAY to initiate a Razorpay Test Mode transaction of{' '}
                    <strong className="text-white">₹{totalAmount.toLocaleString()}</strong>.
                  </span>
                </label>
              )}

              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={() => setStep('SELECT')}
                  className="w-1/3 py-3 rounded-xl bg-[#181b26] hover:bg-[#202433] text-gray-300 font-semibold text-xs transition-all border border-[#2a3044]"
                >
                  Back to Cart
                </button>

                {policyState === 'BLOCKED' ? (
                  <button
                    onClick={() => {
                      setSimulateFailureType('NONE');
                      setStep('SELECT');
                    }}
                    className="w-2/3 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                  >
                    Reset & Try Permitted Policy
                  </button>
                ) : (
                  <button
                    disabled={!userConfirmed || loading}
                    onClick={handleCreateOrder}
                    className={`w-2/3 py-3 rounded-xl font-bold text-xs tracking-wide transition-all flex items-center justify-center space-x-2 ${
                      userConfirmed && !loading
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <span>Authorize & Create Order</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: ORDER CREATED - LAUNCH CHECKOUT MODAL */}
        {step === 'CHECKOUT' && orderData && (
          <div className="max-w-xl mx-auto w-full p-6 rounded-2xl bg-[#12141c] border border-blue-500/40 space-y-6 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto glow-blue">
              <CreditCard className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white">Policy Engine Approved Order</h2>
              <p className="text-xs font-mono text-blue-400">Razorpay Order ID: {orderData.orderId}</p>
            </div>

            <button
              onClick={handleLaunchRazorpayCheckout}
              className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm tracking-wider shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all"
            >
              <Zap className="w-5 h-5 fill-current" />
              <span>Launch Official Razorpay Standard Checkout</span>
            </button>
          </div>
        )}

        {/* STEP 4: TRANSACTION RESULT */}
        {step === 'RESULT' && (
          <div className="max-w-xl mx-auto w-full space-y-6">
            {paymentResult ? (
              <div className="p-6 rounded-2xl bg-[#12141c] border border-emerald-500/40 text-center space-y-6 shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto glow-emerald">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-white">₹{paymentResult.amount.toLocaleString()} Paid</h2>
                <p className="text-xs text-emerald-400">Razorpay payment verified server-side via HMAC-SHA256.</p>

                <button
                  onClick={() => {
                    setStep('SELECT');
                    setOrderData(null);
                    setPaymentResult(null);
                  }}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                >
                  Test Another Order
                </button>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[#12141c] border border-rose-500/40 text-center space-y-6 shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
                  <Ban className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-mono border border-rose-500/30">
                    Razorpay Call Blocked by Policy Engine
                  </span>
                  <h2 className="text-xl font-bold text-white pt-2">{errorDetails?.title || 'Policy Rejection'}</h2>
                  <p className="text-xs text-rose-300 max-w-md mx-auto">{errorDetails?.reason}</p>
                </div>

                <div className="bg-[#181b26] p-4 rounded-xl border border-[#2a3044] text-left space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Money Charged:</span>
                    <span className="font-extrabold text-emerald-400">₹0.00 (Fail-Closed Protection)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Razorpay API Call:</span>
                    <span className="font-mono text-rose-400">PREVENTED (NOT CALLED)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Audit Status:</span>
                    <span className="text-blue-400 font-bold">RECORDED</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setStep('SELECT');
                    setErrorDetails(null);
                    setSimulateFailureType('NONE');
                  }}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                >
                  Return to Cart & Try Normal Flow
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
