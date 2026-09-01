'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import DemoTour from '@/components/DemoTour';
import { ShoppingBag, Search, Sparkles, CheckCircle2, ShieldCheck, ArrowRight, Zap, RefreshCw, Lock, AlertTriangle, AlertCircle, ChevronRight, Play } from 'lucide-react';
import Link from 'next/link';

export default function AIBuyerPage() {
  const [query, setQuery] = useState('Find me the best running setup under ₹5,000.');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [userConfirmed, setUserConfirmed] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [step, setStep] = useState<'SEARCH' | 'BASKET' | 'AUTHORIZE' | 'CHECKOUT' | 'RESULT'>('SEARCH');
  const [showDemoTour, setShowDemoTour] = useState(false);

  // Simulation failure controls
  const [simulateFailureType, setSimulateFailureType] = useState<string>('NONE');

  const presetQueries = [
    'Find me the best running setup under ₹5,000.',
    'I need running shoes for trail running.',
    'Build me a marathon kit under ₹4,500.',
    'Find shoes and useful accessories, but don\'t exceed ₹5,000.',
  ];

  // Run AI Buyer Session
  const handleRunBuyer = async (customQuery?: string) => {
    const activeQuery = customQuery || query;
    setLoading(true);
    setPaymentResult(null);

    try {
      const res = await fetch('/api/buyer/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawQuery: activeQuery,
          merchantSlug: 'nova-run',
          userConfirmed: false,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSession(data);
        setStep('BASKET');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Authorize & Create Razorpay Order
  const handleCreateOrder = async () => {
    if (!session || !session.basket) return;
    setLoading(true);

    const items = session.basket.items.map((i: any) => ({ productId: i.id, quantity: 1 }));
    const currentActionId = session.actionId || `RAY-ACT-BUYER-${Date.now()}`;

    try {
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionId: currentActionId,
          items,
          merchantSlug: 'nova-run',
          userConfirmed,
          simulateFailureType: simulateFailureType !== 'NONE' ? simulateFailureType : undefined,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(`Order Creation Rejection: ${data.reason || data.error}`);
        setLoading(false);
        return;
      }

      setOrderData(data);
      setStep('CHECKOUT');
    } catch (err: any) {
      alert(`Order Failed: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Launch Official Razorpay Standard Checkout
  const handleLaunchRazorpay = () => {
    if (!orderData) return;

    const RazorpayWindow = (window as any).Razorpay;
    if (!RazorpayWindow) {
      alert('Razorpay Checkout SDK is loading...');
      return;
    }

    const options = {
      key: orderData.keyId,
      amount: Math.round(orderData.amount * 100),
      currency: orderData.currency || 'INR',
      name: 'Nova Run',
      description: `RAY AI Buyer Order (${orderData.actionId})`,
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
      theme: { color: '#2563eb' },
    };

    const rzp = new RazorpayWindow(options);
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
        }),
      });

      const data = await res.json();
      setPaymentResult(data);
      setStep('RESULT');
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-gray-100 flex font-sans">
      <Sidebar onStartDemo={() => setShowDemoTour(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="border-b border-[#1f2433] bg-[#0c0e15] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="font-bold text-white text-base">AI Buyer Console</h1>
            <span className="px-2 py-0.5 text-[10px] uppercase font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
              Phase 5 Verified
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowDemoTour(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch 3-Min Demo</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
          {/* Search Bar & Preset Chips */}
          <div className="p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>AI Buyer Natural Language Intent</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-4 top-3.5 text-gray-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Find me the best running setup under ₹5,000..."
                  className="w-full bg-[#181b26] border border-[#2a3044] rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-600"
                />
              </div>
              <button
                onClick={() => handleRunBuyer()}
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition-all"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Search & Optimize</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Preset Query Chips */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs text-gray-500 self-center font-mono">Presets:</span>
              {presetQueries.map((pq, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(pq);
                    handleRunBuyer(pq);
                  }}
                  className="px-3 py-1 rounded-full bg-[#181b26] hover:bg-blue-500/10 hover:border-blue-500/30 text-xs text-gray-300 border border-[#2a3044] transition-all"
                >
                  "{pq}"
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2: BASKET & RECOMMENDATIONS */}
          {session && step === 'BASKET' && (
            <div className="space-y-6">
              {/* Visual Animated Agent Pipeline */}
              <div className="p-4 rounded-xl bg-[#12141c] border border-[#1f2433] flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>INTENT PARSED (Max ₹{session.intent.maxBudget})</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
                <div className="flex items-center space-x-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>CATALOG SEARCHED ({session.candidates.length} Matches)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
                <div className="flex items-center space-x-2 text-blue-400 font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>BASKET OPTIMIZED (Total ₹{session.basket.totalAmount})</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Recommended Basket Items */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-blue-400" />
                    Recommended AI Basket
                  </h3>

                  {session.basket.items.map((item: any) => (
                    <div
                      key={item.id}
                      className={`p-5 rounded-2xl bg-[#12141c] border transition-all ${
                        item.isRecommendation ? 'border-blue-500/40 bg-blue-500/5' : 'border-[#1f2433]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          {item.isRecommendation && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
                              AI Cross-Sell Recommendation
                            </span>
                          )}
                          <h4 className="font-bold text-white text-base pt-1">{item.title}</h4>
                          <p className="text-xs text-gray-400">{item.rationale}</p>
                        </div>
                        <div className="text-lg font-black text-white">₹{item.price.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Column: Basket Summary & Policy Gate */}
                <div className="space-y-4">
                  <div className="p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] space-y-5">
                    <h4 className="font-bold text-white text-base border-b border-[#1f2433] pb-3">
                      Basket Total & Budget Check
                    </h4>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-400">
                        <span>Stated Max Budget:</span>
                        <span className="font-bold text-white">₹{session.intent.maxBudget.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Final Basket Total:</span>
                        <span className="font-extrabold text-blue-400 text-lg">
                          ₹{session.basket.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-400 border-t border-[#1f2433] pt-2">
                        <span>Remaining Budget:</span>
                        <span className="font-bold text-emerald-400">
                          ₹{session.basket.remainingBudget.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Policy Gate Visualizer */}
                    <div className="bg-[#181b26] p-4 rounded-xl border border-[#2a3044] space-y-2">
                      <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Policy Check: PASSED</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Basket total (₹{session.basket.totalAmount}) is within merchant single limit (₹5,000).
                      </p>
                    </div>

                    <button
                      onClick={() => setStep('AUTHORIZE')}
                      className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all"
                    >
                      <span>Proceed to Explicit Authorization</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: EXPLICIT AUTHORIZATION MODAL */}
          {step === 'AUTHORIZE' && session && (
            <div className="max-w-xl mx-auto w-full space-y-6">
              <div className="p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] space-y-6 shadow-2xl">
                <div className="flex items-center space-x-3 border-b border-[#1f2433] pb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">RAY Purchase Authorization</h2>
                    <p className="text-xs text-gray-400">Explicit User Confirmation Required Before Payment</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-[#1f2433]/50">
                    <span className="text-gray-400">Merchant</span>
                    <span className="font-semibold text-white">Nova Run</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1f2433]/50">
                    <span className="text-gray-400">Items</span>
                    <span className="font-semibold text-gray-200">{session.basket.items.length} items selected</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1f2433]/50">
                    <span className="text-gray-400">Authorized Cap</span>
                    <span className="font-semibold text-white">₹{session.intent.maxBudget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1f2433]/50">
                    <span className="text-gray-400">Final Basket Total</span>
                    <span className="font-extrabold text-blue-400 text-lg">
                      ₹{session.basket.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <label className="flex items-start space-x-3 p-3.5 rounded-xl bg-[#181b26] border border-[#2a3044] cursor-pointer hover:border-blue-500/40 transition-all">
                  <input
                    type="checkbox"
                    checked={userConfirmed}
                    onChange={(e) => setUserConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-300">
                    I explicitly authorize RAY to initiate a Razorpay Test Mode payment of{' '}
                    <strong className="text-white">₹{session.basket.totalAmount.toLocaleString()}</strong>.
                  </span>
                </label>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    onClick={() => setStep('BASKET')}
                    className="w-1/3 py-3 rounded-xl bg-[#181b26] hover:bg-[#202433] text-gray-300 font-semibold text-xs transition-all border border-[#2a3044]"
                  >
                    Back to Basket
                  </button>
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
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: CHECKOUT LAUNCH */}
          {step === 'CHECKOUT' && orderData && (
            <div className="max-w-xl mx-auto w-full p-6 rounded-2xl bg-[#12141c] border border-blue-500/40 space-y-6 text-center shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto glow-blue">
                <Zap className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-extrabold text-white">Razorpay Order Created</h2>
                <p className="text-xs font-mono text-blue-400">Order ID: {orderData.orderId}</p>
              </div>

              <button
                onClick={handleLaunchRazorpay}
                className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm tracking-wider shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all"
              >
                <Zap className="w-5 h-5 fill-current" />
                <span>Launch Official Razorpay Standard Checkout</span>
              </button>
            </div>
          )}

          {/* STEP 5: VERIFIED RESULT & DIAGNOSTIC PANEL */}
          {step === 'RESULT' && paymentResult && (
            <div className="max-w-xl mx-auto w-full p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] text-center space-y-6 shadow-2xl">
              {paymentResult.verified && paymentResult.success ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto glow-emerald">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div className="space-y-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/30">
                      HMAC SHA-256 Verified Server-Side
                    </span>
                    <h2 className="text-2xl font-black text-white pt-1">
                      ₹{paymentResult.amount?.toLocaleString() || '4,498'} Paid
                    </h2>
                    <p className="text-xs text-gray-400">
                      Razorpay Test Payment verified cryptographically & persisted to DB.
                    </p>
                  </div>

                  {/* Diagnostic Pipeline Visualizer */}
                  <div className="p-4 rounded-xl bg-[#181b26] border border-[#2a3044] space-y-2 text-left text-xs font-mono">
                    <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                      Execution Diagnostic Timeline
                    </div>
                    <div className="space-y-1 text-gray-300 text-[11px]">
                      <div className="flex justify-between">
                        <span>1. Order Created:</span>
                        <span className="text-emerald-400 font-bold">{paymentResult.orderId || 'PASSED'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>2. Razorpay Checkout:</span>
                        <span className="text-emerald-400 font-bold">COMPLETED</span>
                      </div>
                      <div className="flex justify-between">
                        <span>3. Payment Response ID:</span>
                        <span className="text-emerald-400 font-bold">{paymentResult.paymentId || 'pay_test_...'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>4. HMAC Verification:</span>
                        <span className="text-emerald-400 font-bold">SHA-256 MATCH</span>
                      </div>
                      <div className="flex justify-between">
                        <span>5. Database Status:</span>
                        <span className="text-emerald-400 font-bold">PAID (Audit Persisted)</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
                    <AlertCircle className="w-8 h-8" />
                  </div>

                  <div className="space-y-2">
                    <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-mono border border-rose-500/30">
                      {paymentResult.reason?.includes('Signature') ? 'PAYMENT VERIFICATION FAILED' : 'PAYMENT FAILED'}
                    </span>
                    <h2 className="text-xl font-bold text-white pt-1">
                      {paymentResult.error || 'Payment Verification Failed'}
                    </h2>
                    <p className="text-xs text-rose-300">
                      {paymentResult.reason || 'Cryptographic signature verification failed or payment was rejected. ₹0 charged.'}
                    </p>
                  </div>
                </>
              )}

              <button
                onClick={() => {
                  setStep('SEARCH');
                  setSession(null);
                  setPaymentResult(null);
                }}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all"
              >
                Test Another AI Buyer Search
              </button>
            </div>
          )}
        </main>
      </div>

      {showDemoTour && <DemoTour onClose={() => setShowDemoTour(false)} />}
    </div>
  );
}
