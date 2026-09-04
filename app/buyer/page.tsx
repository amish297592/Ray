'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import DemoTour from '@/components/DemoTour';
import { ShoppingBag, Search, Sparkles, CheckCircle2, ShieldCheck, ArrowRight, Zap, RefreshCw, Lock, AlertCircle, ChevronRight, Play, XCircle, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function AIBuyerPage() {
  const [query, setQuery] = useState('Find me the best running setup.');
  const [loading, setLoading] = useState(false);
  const [loadingStateText, setLoadingStateText] = useState<string>('Analyzing request...');
  const [session, setSession] = useState<any>(null);
  const [userConfirmed, setUserConfirmed] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [step, setStep] = useState<'SEARCH' | 'BASKET' | 'AUTHORIZE' | 'CHECKOUT' | 'RESULT'>('SEARCH');
  const [showDemoTour, setShowDemoTour] = useState(false);

  // Simulation failure controls
  const [simulateFailureType, setSimulateFailureType] = useState<string>('NONE');

  const presetQueries = [
    'Find me the best running setup.',
    'Build me a premium marathon kit.',
    'Find trail running shoes and matching socks.',
    'Buy Apex GPS Smartwatch and Trail Blazer GTX.',
    'Build the best setup regardless of price.',
  ];

  // Run AI Buyer Session
  const handleRunBuyer = async (customQuery?: string) => {
    const activeQuery = customQuery || query;
    setLoading(true);
    setLoadingStateText('Searching merchant catalog & optimizing basket...');
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
      } else {
        alert(`AI Buyer Error: ${data.error || 'Failed to analyze intent'}`);
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
    setLoadingStateText('Evaluating Policy Engine & creating Razorpay order...');

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
        alert(`Policy Engine Rejection: ${data.reason || data.error}`);
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
    setLoadingStateText('Verifying HMAC SHA-256 signature server-side...');
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

      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <header className="border-b border-[#1f2433] bg-[#0c0e15] px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="font-bold text-white text-base">AI Buyer Console</h1>
            <span className="px-2.5 py-0.5 text-[10px] uppercase font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
              Unconstrained Intent • Bounded Execution
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

        {/* Security Boundary Sequence Visualizer */}
        <div className="bg-[#0e1017] border-b border-[#1f2433] px-4 md:px-6 py-2.5 overflow-x-auto">
          <div className="max-w-6xl mx-auto flex items-center justify-between text-[11px] font-mono whitespace-nowrap min-w-[650px]">
            <div className="flex items-center space-x-1.5 text-blue-400 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>1. AI RECOMMENDS FREELY</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>2. POLICY ENGINE GATES PAYMENT</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            <div className="flex items-center space-x-1.5 text-purple-400 font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>3. USER AUTHORIZES</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>4. RAZORPAY EXECUTES</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6">
          {/* Search Bar & Preset Chips */}
          <div className="p-5 md:p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Natural Language Shopping Intent</span>
              </div>
              <span className="text-[11px] font-mono text-gray-400">
                Arbitrary price intents allowed • Merchant limit ₹5,000 enforced at Policy Gate
              </span>
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="relative flex-1 min-w-0">
                <Search className="w-5 h-5 absolute left-4 top-3.5 text-gray-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Build me a premium marathon kit or find trail running shoes..."
                  className="w-full bg-[#181b26] border border-[#2a3044] rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-600"
                />
              </div>
              <button
                onClick={() => handleRunBuyer()}
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all whitespace-nowrap"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{loadingStateText}</span>
                  </>
                ) : (
                  <>
                    <span>Search & Optimize</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Preset Query Chips */}
            <div className="space-y-2 pt-1">
              <span className="text-xs text-gray-500 font-mono">Preset AI Shopping Intents (Click to test):</span>
              <div className="flex flex-wrap gap-2">
                {presetQueries.map((pq, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(pq);
                      handleRunBuyer(pq);
                    }}
                    className="px-3 py-1.5 rounded-full bg-[#181b26] hover:bg-blue-500/10 hover:border-blue-500/30 text-xs text-gray-300 border border-[#2a3044] transition-all text-left"
                  >
                    "{pq}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* STEP 2: BASKET & RECOMMENDATIONS */}
          {session && step === 'BASKET' && (
            <div className="space-y-6">
              {/* Visual Animated Agent Pipeline */}
              <div className="p-4 rounded-xl bg-[#12141c] border border-[#1f2433] grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="flex items-center space-x-2 text-emerald-400 min-w-0">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">1. INTENT PARSED ({session.intent.category})</span>
                </div>
                <div className="flex items-center space-x-2 text-emerald-400 min-w-0">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">2. CATALOG (35 DB MATCHES)</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-400 font-bold min-w-0">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span className="truncate">3. OPTIMIZED ({session.basket.items.length} SELECTED)</span>
                </div>
                <div className={`flex items-center space-x-2 font-bold min-w-0 ${session.policyDecision.allowed ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {session.policyDecision.allowed ? <ShieldCheck className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                  <span className="truncate">4. POLICY ({session.policyDecision.allowed ? 'PASSED' : 'BLOCKED'})</span>
                </div>
              </div>

              {/* Responsive 2-Column Desktop / 1-Column Mobile Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left Column: Recommended AI Basket Items (lg:col-span-2) */}
                <div className="lg:col-span-2 space-y-4 min-w-0">
                  <div className="flex items-center justify-between border-b border-[#1f2433] pb-3">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-blue-400" />
                      Recommended AI Basket
                    </h3>
                    <span className="text-xs font-mono text-gray-400">
                      {session.basket.items.length} items selected from 35 catalog matches
                    </span>
                  </div>

                  {session.basket.items.map((item: any) => (
                    <div
                      key={item.id}
                      className={`p-5 rounded-2xl bg-[#12141c] border transition-all space-y-2 ${
                        item.isRecommendation ? 'border-blue-500/40 bg-blue-500/5' : 'border-[#1f2433]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
                              {item.isRecommendation ? 'AI Cross-Sell Attachment' : 'Primary Intent Match'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-gray-800 text-gray-300">
                              {item.category}
                            </span>
                          </div>
                          <h4 className="font-bold text-white text-base pt-1">{item.title}</h4>
                          <p className="text-xs text-gray-400 leading-relaxed">{item.rationale}</p>
                        </div>
                        <div className="text-lg font-black text-white whitespace-nowrap shrink-0">
                          ₹{item.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Column: Basket Total & Policy Evaluation Panel (lg:col-span-1) */}
                <div className="space-y-4 min-w-0">
                  <div className="p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] space-y-5 shadow-2xl">
                    <h4 className="font-bold text-white text-base border-b border-[#1f2433] pb-3 flex items-center justify-between">
                      <span>Policy Evaluation</span>
                      <span className="text-[10px] font-mono bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">
                        Server Authoritative
                      </span>
                    </h4>

                    {/* Financial Metrics Stack */}
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center text-gray-400">
                        <span>Server Calculated Total:</span>
                        <span className="font-black text-blue-400 text-xl">
                          ₹{session.basket.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-gray-400 border-t border-[#1f2433] pt-2 text-xs">
                        <span>Merchant Single Transaction Limit:</span>
                        <span className="font-bold text-white">
                          ₹{session.policyDecision.limits.maxTransactionLimit.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-gray-400 border-t border-[#1f2433]/50 pt-2 text-xs">
                        <span>24-Hour Merchant Spend Cap:</span>
                        <span className="font-bold text-gray-300">
                          ₹{session.policyDecision.limits.maxDailySpendLimit.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Prominent Policy Gate Decision Box */}
                    {session.policyDecision.allowed && session.policyDecision.decision !== 'BLOCK' ? (
                      <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/40 space-y-2">
                        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
                          <ShieldCheck className="w-4 h-4" />
                          <span>POLICY CHECK: PASSED</span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">
                          Basket subtotal (₹{session.basket.totalAmount.toLocaleString()}) is within merchant single limit (₹5,000). Explicit user authorization required before payment execution.
                        </p>
                        <div className="text-[11px] font-mono text-emerald-400 pt-1">
                          ✓ Amount charged: ₹0 (Awaiting authorization)
                        </div>
                      </div>
                    ) : (
                      <div className="bg-rose-500/10 p-4.5 rounded-xl border border-rose-500/40 space-y-3">
                        <div className="flex items-center space-x-2 text-xs font-extrabold text-rose-400">
                          <ShieldAlert className="w-4 h-4" />
                          <span>POLICY CHECK: BLOCKED</span>
                        </div>
                        <div className="text-xs text-rose-200 font-bold border-b border-rose-500/20 pb-2">
                          Transaction exceeds merchant authorization limit.
                        </div>
                        <div className="space-y-1 text-xs text-gray-300">
                          <div className="flex justify-between">
                            <span>Basket Total:</span>
                            <span className="font-bold text-white">₹{session.basket.totalAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Max Single Limit:</span>
                            <span className="font-bold text-white">₹5,000</span>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/30 text-[11px] font-mono text-rose-300">
                          🛡️ <strong>Amount Charged: ₹0</strong><br />
                          Razorpay order creation blocked deterministically by Policy Engine.
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    {session.policyDecision.allowed && session.policyDecision.decision !== 'BLOCK' ? (
                      <button
                        onClick={() => setStep('AUTHORIZE')}
                        className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all"
                      >
                        <span>Proceed to Explicit Authorization</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="w-full py-3.5 rounded-xl bg-gray-800 text-rose-400 font-bold text-xs text-center border border-rose-500/30 shadow-inner">
                        Razorpay Payment Blocked by Policy Engine (₹0 Charged)
                      </div>
                    )}
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
                    <h2 className="text-lg font-bold text-white">Explicit Purchase Authorization</h2>
                    <p className="text-xs text-gray-400">Human Authorization Layer • AI cannot move money directly</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-[#1f2433]/50">
                    <span className="text-gray-400">Merchant</span>
                    <span className="font-semibold text-white">Nova Run</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1f2433]/50">
                    <span className="text-gray-400">Selected Items</span>
                    <span className="font-semibold text-gray-200">{session.basket.items.length} items</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1f2433]/50">
                    <span className="text-gray-400">Merchant Policy Limit</span>
                    <span className="font-semibold text-white">₹5,000 Cap</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1f2433]/50">
                    <span className="text-gray-400">Server Calculated Basket Total</span>
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
                  <span className="text-xs text-gray-300 leading-relaxed">
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
