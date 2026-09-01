'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import DemoTour from '@/components/DemoTour';
import { LayoutDashboard, Zap, ShoppingBag, ShieldCheck, FileCode, Play, ArrowRight, TrendingUp, DollarSign, Users, Award, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const [showDemoTour, setShowDemoTour] = useState(false);

  return (
    <div className="min-h-screen bg-[#090a0f] text-gray-100 flex font-sans">
      <Sidebar onStartDemo={() => setShowDemoTour(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="border-b border-[#1f2433] bg-[#0c0e15] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="font-bold text-white text-base">Executive Command Center</h1>
            <span className="px-2 py-0.5 text-[10px] uppercase font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
              Nova Run Storefront
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

        {/* Dashboard Main Content */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
          {/* Executive Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#12141c] border border-[#1f2433] space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
                <span>TOTAL GMV</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white">₹1,48,500</div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                <TrendingUp className="w-3 h-3" /> +22.4% vs last month
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#12141c] border border-[#1f2433] space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
                <span>AI-ATTRIBUTED LIFT</span>
                <Zap className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-blue-400">+₹34,200</div>
              <div className="text-[11px] text-gray-400 font-mono">
                Modelled Estimate (Upsells & Cross-sells)
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#12141c] border border-[#1f2433] space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
                <span>AI COMMERCE READINESS</span>
                <Award className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-400">92 / 100</div>
              <div className="text-[11px] text-purple-300 font-mono">
                ● AI READY (Passport Contract Active)
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#12141c] border border-[#1f2433] space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
                <span>TRANSACTION SAFETY</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">100 / 100</div>
              <div className="text-[11px] text-emerald-300 font-mono">
                Fail-Closed & Idempotent Verified
              </div>
            </div>
          </div>

          {/* Actionable Intelligence Feed */}
          <div className="p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-400" />
                Actionable Revenue Intelligence Feed
              </h2>
              <span className="text-xs font-mono text-gray-400">Real-Time SQLite Signals</span>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-[#181b26] border border-[#2a3044] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <span>Cross-Sell Attach Opportunity</span>
                    <span className="px-2 py-0.5 text-[10px] bg-blue-500/20 text-blue-400 rounded">High Attach (42%)</span>
                  </div>
                  <p className="text-xs text-gray-300">
                    1,240 customers buying Nova Runner X1 Pro have high affinity for Performance Anti-Blister Socks (₹499).
                  </p>
                </div>
                <Link
                  href="/agent"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold whitespace-nowrap self-start md:self-auto"
                >
                  Review in Revenue Agent
                </Link>
              </div>

              <div className="p-4 rounded-xl bg-[#181b26] border border-[#2a3044] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <span>Performance Upsell Recommendation</span>
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 rounded">₹900 Delta</span>
                  </div>
                  <p className="text-xs text-gray-300">
                    Trail Blazer GTX (₹4,899) offers waterproof GORE-TEX upgrade over base runner for trail runners.
                  </p>
                </div>
                <Link
                  href="/agent"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold whitespace-nowrap self-start md:self-auto"
                >
                  View Product Matrix
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Hub Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/agent"
              className="p-5 rounded-2xl bg-[#12141c] border border-[#1f2433] hover:border-blue-500/50 transition-all space-y-2 group"
            >
              <Zap className="w-5 h-5 text-blue-400" />
              <div className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">01. Revenue Agent</div>
              <p className="text-xs text-gray-400">Upsell, cross-sell, and campaign engines.</p>
            </Link>

            <Link
              href="/buyer"
              className="p-5 rounded-2xl bg-[#12141c] border border-[#1f2433] hover:border-indigo-500/50 transition-all space-y-2 group"
            >
              <ShoppingBag className="w-5 h-5 text-indigo-400" />
              <div className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">02. AI Buyer Console</div>
              <p className="text-xs text-gray-400">Natural-language intent & bounded basket.</p>
            </Link>

            <Link
              href="/passport"
              className="p-5 rounded-2xl bg-[#12141c] border border-[#1f2433] hover:border-purple-500/50 transition-all space-y-2 group"
            >
              <FileCode className="w-5 h-5 text-purple-400" />
              <div className="font-bold text-sm text-white group-hover:text-purple-400 transition-colors">03. Commerce Passport</div>
              <p className="text-xs text-gray-400">Version 1.0 Live Machine JSON contract.</p>
            </Link>

            <Link
              href="/resilience"
              className="p-5 rounded-2xl bg-[#12141c] border border-[#1f2433] hover:border-emerald-500/50 transition-all space-y-2 group"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">04. Transaction Safety</div>
              <p className="text-xs text-gray-400">100/100 Safety & failure simulations.</p>
            </Link>
          </div>
        </main>
      </div>

      {showDemoTour && <DemoTour onClose={() => setShowDemoTour(false)} />}
    </div>
  );
}
