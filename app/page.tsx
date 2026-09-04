'use client';

import React from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  ShoppingBag,
  FileCode,
  CheckCircle2,
  Lock,
  ChevronRight,
  Sparkles,
  TrendingUp,
  XCircle,
  Activity,
  FileText,
} from 'lucide-react';

export default function LandingPage() {
  // Framer Motion Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-gray-100 flex font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <header className="border-b border-[#1f2433] bg-[#0c0e15] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono text-gray-400">
            <span className="text-blue-400 font-bold">RAY OS</span>
            <span>/</span>
            <span className="text-white">AI Revenue & Commerce Operating System</span>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="text-gray-400">Merchant: <strong className="text-white">Nova Run</strong></span>
            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/30">● Test Mode</span>
          </div>
        </header>

        {/* Scrollable Main Landing Canvas */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-16 py-10">
          {/* SECTION 1 — HERO */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6 pt-4"
          >
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              <span>RAY • AI REVENUE & COMMERCE OS</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              Turn Every Merchant Into An <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                AI-Native Storefront.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed">
              RAY connects AI-powered commerce intelligence with bounded, auditable Razorpay payments.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center space-x-2 transition-all hover:scale-105"
              >
                <span>Explore RAY</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/buyer"
                className="px-6 py-3.5 rounded-xl bg-[#181b26] hover:bg-[#202433] text-gray-200 border border-[#2a3044] font-bold text-sm transition-all flex items-center space-x-2 hover:border-blue-500/40"
              >
                <ShoppingBag className="w-4 h-4 text-blue-400" />
                <span>Try AI Buyer</span>
              </Link>
            </div>

            {/* Interactive Animated Pipeline Map */}
            <div className="mt-8 p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] space-y-4 text-left shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#1f2433] pb-3">
                <div className="text-xs font-mono text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span>DETERMINISTIC COMMERCE & PAYMENT PIPELINE</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  ● LOCALHOST 3000 VERIFIED
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-4 rounded-xl bg-[#181b26] border border-[#2a3044] space-y-1.5 hover:border-blue-500/50 transition-all">
                  <div className="text-blue-400 font-bold flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5" />
                    <span>01. DISCOVER</span>
                  </div>
                  <div className="text-gray-200 font-bold font-sans">AI Commerce Passport</div>
                  <div className="text-[10px] text-gray-400">Machine Contract 92/100</div>
                </div>

                <div className="p-4 rounded-xl bg-[#181b26] border border-[#2a3044] space-y-1.5 hover:border-indigo-500/50 transition-all">
                  <div className="text-indigo-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>02. OPTIMIZE</span>
                  </div>
                  <div className="text-gray-200 font-bold font-sans">AI Buyer Engine</div>
                  <div className="text-[10px] text-gray-400">Unconstrained Basket</div>
                </div>

                <div className="p-4 rounded-xl bg-[#181b26] border border-[#2a3044] space-y-1.5 hover:border-amber-500/50 transition-all">
                  <div className="text-amber-400 font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>03. GATE</span>
                  </div>
                  <div className="text-gray-200 font-bold font-sans">Policy Engine</div>
                  <div className="text-[10px] text-gray-400">₹5,000 Cap Enforcement</div>
                </div>

                <div className="p-4 rounded-xl bg-[#181b26] border border-[#2a3044] space-y-1.5 hover:border-emerald-500/50 transition-all">
                  <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>04. EXECUTE</span>
                  </div>
                  <div className="text-gray-200 font-bold font-sans">Razorpay Test Checkout</div>
                  <div className="text-[10px] text-gray-400">HMAC SHA-256 Verified</div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* SECTION 2 — THE PROBLEM (Traditional vs Agentic Commerce) */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="space-y-6 pt-6 border-t border-[#1f2433]"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                The Shift To Agentic Commerce
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
                Why Web 2.0 visual storefronts fail when autonomous AI agents shop on behalf of consumers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Traditional Commerce */}
              <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-[#12141c]/60 border border-rose-500/30 space-y-4">
                <div className="flex items-center space-x-2 text-rose-400 font-mono text-xs font-bold uppercase tracking-wider">
                  <XCircle className="w-4 h-4" />
                  <span>Traditional E-Commerce Storefront</span>
                </div>
                <div className="space-y-2 text-xs text-gray-300 font-mono">
                  <div className="p-2.5 rounded-lg bg-[#181b26] border border-rose-500/20">Human searches keyword manually</div>
                  <div className="p-2.5 rounded-lg bg-[#181b26] border border-rose-500/20">Human compares products manually</div>
                  <div className="p-2.5 rounded-lg bg-[#181b26] border border-rose-500/20">Human adds items to visual cart</div>
                  <div className="p-2.5 rounded-lg bg-[#181b26] border border-rose-500/20">No machine-readable merchant contract</div>
                  <div className="p-2.5 rounded-lg bg-[#181b26] border border-rose-500/20">LLMs risk price hallucination & direct money access</div>
                </div>
              </motion.div>

              {/* Agentic Commerce with RAY */}
              <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-[#12141c] border border-emerald-500/40 space-y-4 shadow-xl">
                <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Agentic Commerce Operating System (RAY)</span>
                </div>
                <div className="space-y-2 text-xs text-gray-300 font-mono">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">AI understands natural shopping intent</div>
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">AI discovers machine-readable catalog</div>
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">AI optimizes basket with graph cross-sells</div>
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">Policy Engine deterministically limits spending</div>
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">User explicitly authorizes ➔ Razorpay executes</div>
                </div>
              </motion.div>
            </div>
          </motion.section>

          {/* SECTION 3 — CORE CAPABILITIES (5 Cards) */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="space-y-6 pt-6 border-t border-[#1f2433]"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                5 Core System Hubs
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
                Comprehensive architecture built to turn merchants into AI-native storefronts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Command Center */}
              <motion.div variants={itemVariants}>
                <Link
                  href="/dashboard"
                  className="p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] hover:border-blue-500/50 transition-all group block space-y-3 h-full"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                    Command Center
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Executive merchant overview featuring GMV, AI-attributed lift, active opportunities, and AI Commerce Readiness (92/100).
                  </p>
                </Link>
              </motion.div>

              {/* Card 2: Revenue Agent */}
              <motion.div variants={itemVariants}>
                <Link
                  href="/agent"
                  className="p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] hover:border-indigo-500/50 transition-all group block space-y-3 h-full"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-base group-hover:text-indigo-400 transition-colors">
                    Revenue Agent
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    3 growth engines: Upsell upgrades, Cross-Sell graph co-occurrences, and Campaign revenue impact formulas.
                  </p>
                </Link>
              </motion.div>

              {/* Card 3: AI Buyer */}
              <motion.div variants={itemVariants}>
                <Link
                  href="/buyer"
                  className="p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] hover:border-purple-500/50 transition-all group block space-y-3 h-full"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-base group-hover:text-purple-400 transition-colors">
                    AI Buyer Console
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Parses natural language intents freely, ranks catalog candidates, and builds multi-item recommendation baskets.
                  </p>
                </Link>
              </motion.div>

              {/* Card 4: Commerce Passport */}
              <motion.div variants={itemVariants}>
                <Link
                  href="/passport"
                  className="p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] hover:border-amber-500/50 transition-all group block space-y-3 h-full"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-base group-hover:text-amber-400 transition-colors">
                    AI Commerce Passport
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Machine-readable merchant identity JSON contract exposed live at <code className="text-amber-300">GET /api/agent/merchant/nova-run</code>.
                  </p>
                </Link>
              </motion.div>

              {/* Card 5: Transaction Safety */}
              <motion.div variants={itemVariants}>
                <Link
                  href="/resilience"
                  className="p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] hover:border-emerald-500/50 transition-all group block space-y-3 h-full"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors">
                    Transaction Safety & Resilience
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    100/100 Safety Score, explicit state machine, idempotency duplicate prevention, and fail-closed ₹0 charge guarantee.
                  </p>
                </Link>
              </motion.div>

              {/* Card 6: System Audit Console */}
              <motion.div variants={itemVariants}>
                <Link
                  href="/audit"
                  className="p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] hover:border-blue-400/50 transition-all group block space-y-3 h-full"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                    System Audit Console
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Live database audit event trail stream, cryptographic security checks, and 45/45 test suite verification.
                  </p>
                </Link>
              </motion.div>
            </div>
          </motion.section>

          {/* SECTION 4 — THE TRUST BOUNDARY */}
          <motion.section
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-[#12141c] via-[#161a29] to-[#0e1017] border border-blue-500/40 space-y-6 shadow-2xl text-center"
          >
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-mono border border-blue-500/30">
                CENTRAL ARCHITECTURAL SECURITY PRINCIPLE
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                The RAY Trust Boundary
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 max-w-2xl mx-auto leading-relaxed">
                AI gets intelligence. Policy gets control. Users get authority. Payments get verification.
              </p>
            </div>

            {/* Sequence Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-xs font-mono">
              <div className="p-4 rounded-xl bg-[#181b26] border border-blue-500/40 space-y-1">
                <div className="text-blue-400 font-bold">1. AI RECOMMENDS</div>
                <div className="text-gray-300 font-sans text-xs">Searches freely based on intent</div>
              </div>
              <div className="p-4 rounded-xl bg-[#181b26] border border-amber-500/40 space-y-1">
                <div className="text-amber-400 font-bold">2. POLICY DECIDES</div>
                <div className="text-gray-300 font-sans text-xs">Enforces ₹5k limit & caps</div>
              </div>
              <div className="p-4 rounded-xl bg-[#181b26] border border-purple-500/40 space-y-1">
                <div className="text-purple-400 font-bold">3. USER AUTHORIZES</div>
                <div className="text-gray-300 font-sans text-xs">Human explicit confirmation</div>
              </div>
              <div className="p-4 rounded-xl bg-[#181b26] border border-emerald-500/40 space-y-1">
                <div className="text-emerald-400 font-bold">4. RAZORPAY EXECUTES</div>
                <div className="text-gray-300 font-sans text-xs">HMAC SHA-256 Verified</div>
              </div>
            </div>
          </motion.section>

          {/* SECTION 5 — REVENUE ENGINES */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="space-y-6 pt-6 border-t border-[#1f2433]"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                3 Merchant Revenue Growth Engines
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
                RAY helps merchants increase revenue rather than acting as a standard shopping chatbot.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] space-y-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
                  Engine 01
                </span>
                <h3 className="font-bold text-white text-base">Upsell Upgrade Engine</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Identifies higher-tier performance models (e.g. PaceMaker Carbon Race Shoe) matching intent to maximize transaction value.
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] space-y-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase">
                  Engine 02
                </span>
                <h3 className="font-bold text-white text-base">Cross-Sell Graph Engine</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Queries historical purchase co-occurrence confidence to attach complementary accessories (e.g. Anti-Blister Socks with 42% attach rate).
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] space-y-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                  Engine 03
                </span>
                <h3 className="font-bold text-white text-base">Campaign Orchestrator</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Calculates modeled revenue impact formulas to propose merchant-approved targeted campaigns for idle inventory.
                </p>
              </motion.div>
            </div>
          </motion.section>

          {/* SECTION 6 — FAILURE-SAFE COMMERCE */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="space-y-6 pt-6 border-t border-[#1f2433]"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Agentic Commerce Needs Safe Failure
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
                Deterministic fail-closed behavior ensures ₹0 duplicate charges or unauthorized moves.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-[#12141c] border border-emerald-500/30 text-emerald-400 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Payment Verified</span>
                </div>
                <div className="text-[11px] text-gray-400">HMAC SHA-256 Signature Match</div>
              </div>

              <div className="p-4 rounded-xl bg-[#12141c] border border-emerald-500/30 text-emerald-400 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Policy Allowed</span>
                </div>
                <div className="text-[11px] text-gray-400">Cart Total ≤ ₹5,000 Cap</div>
              </div>

              <div className="p-4 rounded-xl bg-[#12141c] border border-rose-500/30 text-rose-400 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" />
                  <span>Limit Breach Blocked</span>
                </div>
                <div className="text-[11px] text-gray-400">₹0 Charged on Policy Breach</div>
              </div>

              <div className="p-4 rounded-xl bg-[#12141c] border border-rose-500/30 text-rose-400 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" />
                  <span>Signature Mismatch</span>
                </div>
                <div className="text-[11px] text-gray-400">Payment Rejected & Audited</div>
              </div>

              <div className="p-4 rounded-xl bg-[#12141c] border border-blue-500/30 text-blue-400 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Idempotency Active</span>
                </div>
                <div className="text-[11px] text-gray-400">ActionId Lock Prevents Double Charge</div>
              </div>

              <div className="p-4 rounded-xl bg-[#12141c] border border-purple-500/30 text-purple-400 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Audit Event Logged</span>
                </div>
                <div className="text-[11px] text-gray-400">Immutable DB Audit Trail</div>
              </div>
            </div>
          </motion.section>

          {/* SECTION 7 — FINAL CTA */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-10 rounded-3xl bg-gradient-to-r from-blue-900/40 via-[#12141c] to-indigo-900/40 border border-blue-500/40 text-center space-y-6 shadow-2xl"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Enter The RAY Commerce Layer
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto leading-relaxed">
              Experience the complete Razorpay Autonomous Yield operating system live on localhost.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/dashboard"
                className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center space-x-2 transition-all hover:scale-105"
              >
                <span>Open Command Center</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/buyer"
                className="px-8 py-4 rounded-xl bg-[#181b26] hover:bg-[#202433] text-gray-200 border border-[#2a3044] font-bold text-sm transition-all flex items-center space-x-2 hover:border-blue-500/40"
              >
                <ShoppingBag className="w-4 h-4 text-blue-400" />
                <span>Try AI Buyer</span>
              </Link>
            </div>
          </motion.section>
        </main>
      </div>
    </div>
  );
}
