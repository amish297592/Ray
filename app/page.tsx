'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import DemoTour from '@/components/DemoTour';
import { ArrowRight, ShieldCheck, Zap, ShoppingBag, FileCode, Play, CheckCircle2, Lock } from 'lucide-react';

export default function LandingPage() {
  const [showDemoTour, setShowDemoTour] = useState(false);

  return (
    <div className="min-h-screen bg-[#090a0f] text-gray-100 flex font-sans">
      {/* Sidebar */}
      <Sidebar onStartDemo={() => setShowDemoTour(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="border-b border-[#1f2433] bg-[#0c0e15] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono text-gray-400">
            <span className="text-blue-400 font-bold">RAY OS</span>
            <span>/</span>
            <span className="text-white">AI Revenue & Commerce Operating System</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowDemoTour(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch 3-Min Judge Demo</span>
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 p-8 max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-4 pt-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              <span>RAZORPAY AI BUILDATHON SUBMISSION</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Turn Every Merchant Into An <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                AI-Native Storefront.
              </span>
            </h1>

            <p className="text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
              RAY connects merchant revenue intelligence, AI buyer discovery, machine-readable contracts, and bounded Razorpay payments under deterministic financial guardrails.
            </p>

            <div className="pt-4 flex items-center justify-center space-x-4">
              <button
                onClick={() => setShowDemoTour(true)}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center space-x-2 transition-all hover:scale-105"
              >
                <Play className="w-4 h-4 fill-current text-white" />
                <span>Start 3-Minute Demo</span>
              </button>

              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-xl bg-[#181b26] hover:bg-[#202433] text-gray-200 border border-[#2a3044] font-bold text-sm transition-all"
              >
                Explore Command Center
              </Link>
            </div>
          </div>

          {/* Architecture Pipeline Map */}
          <div className="p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] space-y-4">
            <div className="text-xs font-mono text-gray-400 uppercase tracking-widest text-center">
              DETERMINISTIC COMMERCE & PAYMENT PIPELINE
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs font-mono font-bold">
              <div className="p-4 rounded-xl bg-[#181b26] border border-[#2a3044] space-y-1">
                <div className="text-blue-400">01. DISCOVER</div>
                <div className="text-gray-300 font-sans text-xs">AI Commerce Passport</div>
                <div className="text-[10px] text-gray-500">92/100 AI Ready</div>
              </div>

              <div className="p-4 rounded-xl bg-[#181b26] border border-[#2a3044] space-y-1">
                <div className="text-indigo-400">02. OPTIMIZE</div>
                <div className="text-gray-300 font-sans text-xs">AI Buyer Engine</div>
                <div className="text-[10px] text-gray-500">₹4,498 Basket</div>
              </div>

              <div className="p-4 rounded-xl bg-[#181b26] border border-[#2a3044] space-y-1">
                <div className="text-amber-400">03. GATE</div>
                <div className="text-gray-300 font-sans text-xs">Policy Engine</div>
                <div className="text-[10px] text-gray-500">₹5,000 Cap PASS</div>
              </div>

              <div className="p-4 rounded-xl bg-[#181b26] border border-[#2a3044] space-y-1">
                <div className="text-emerald-400">04. EXECUTE</div>
                <div className="text-gray-300 font-sans text-xs">Razorpay Test Checkout</div>
                <div className="text-[10px] text-gray-500">HMAC Verified</div>
              </div>
            </div>
          </div>

          {/* 4 Core System Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/dashboard" className="p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] hover:border-blue-500/50 transition-all group space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                Command Center & Revenue Agent
              </h3>
              <p className="text-xs text-gray-400">
                Identifies upsells, cross-sells, and campaigns using real SQLite product relationship graphs.
              </p>
            </Link>

            <Link href="/buyer" className="p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] hover:border-indigo-500/50 transition-all group space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base group-hover:text-indigo-400 transition-colors">
                AI Buyer & Agentic Commerce
              </h3>
              <p className="text-xs text-gray-400">
                Parses natural-language queries, searches candidates, and optimizes baskets under strict budgets.
              </p>
            </Link>

            <Link href="/passport" className="p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] hover:border-purple-500/50 transition-all group space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <FileCode className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base group-hover:text-purple-400 transition-colors">
                AI Commerce Passport
              </h3>
              <p className="text-xs text-gray-400">
                Exposes versioned machine-readable contract JSON at GET /api/agent/merchant/nova-run.
              </p>
            </Link>

            <Link href="/resilience" className="p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] hover:border-emerald-500/50 transition-all group space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors">
                Transaction Safety & Resilience
              </h3>
              <p className="text-xs text-gray-400">
                Explicit state machine, idempotency unique index protection, and fail-closed ₹0 charge guarantee.
              </p>
            </Link>
          </div>
        </main>
      </div>

      {/* Guided Pitch Demo Overlay */}
      {showDemoTour && <DemoTour onClose={() => setShowDemoTour(false)} />}
    </div>
  );
}
