'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import DemoTour from '@/components/DemoTour';
import { Zap, TrendingUp, Layers, RefreshCw, CheckCircle2, ArrowRight, Play, AlertCircle } from 'lucide-react';

export default function AgentPage() {
  const [showDemoTour, setShowDemoTour] = useState(false);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEngine, setActiveEngine] = useState<'ALL' | 'UPSELL' | 'CROSS_SELL' | 'CAMPAIGN'>('ALL');

  useEffect(() => {
    fetch('/api/agent/opportunities')
      .then((res) => res.json())
      .then((data) => {
        if (data.opportunities) {
          setOpportunities(data.opportunities);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#090a0f] text-gray-100 flex font-sans">
      <Sidebar onStartDemo={() => setShowDemoTour(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b border-[#1f2433] bg-[#0c0e15] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="font-bold text-white text-base">RAY Revenue Intelligence Agent</h1>
            <span className="px-2 py-0.5 text-[10px] uppercase font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
              Phase 4 & 4.1 Verified
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
          {/* Hero Banner */}
          <div className="p-6 rounded-2xl bg-[#12141c] border border-blue-500/40 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-mono border border-blue-500/30">
                <span>⚡ 3 REVENUE ENGINES ACTIVE</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white">Autonomous Revenue Operator</h2>
              <p className="text-xs text-gray-400 max-w-xl">
                Identifies upsell, cross-sell, and campaign growth opportunities from SQLite database co-occurrence graphs.
              </p>
            </div>

            <div className="flex items-center space-x-4 bg-[#181b26] p-4 rounded-2xl border border-[#2a3044]">
              <div className="text-center">
                <div className="text-3xl font-black text-blue-400">+₹34,200</div>
                <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider pt-1">
                  MODELLED ESTIMATE LIFT
                </div>
              </div>
            </div>
          </div>

          {/* Engine Filter Tabs */}
          <div className="flex border-b border-[#1f2433] space-x-6 text-sm font-semibold">
            <button
              onClick={() => setActiveEngine('ALL')}
              className={`pb-3 transition-all ${
                activeEngine === 'ALL'
                  ? 'text-blue-400 border-b-2 border-blue-500 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All Revenue Engines ({opportunities.length})
            </button>
            <button
              onClick={() => setActiveEngine('UPSELL')}
              className={`pb-3 transition-all ${
                activeEngine === 'UPSELL'
                  ? 'text-blue-400 border-b-2 border-blue-500 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Engine 01: Upsell Matrix
            </button>
            <button
              onClick={() => setActiveEngine('CROSS_SELL')}
              className={`pb-3 transition-all ${
                activeEngine === 'CROSS_SELL'
                  ? 'text-blue-400 border-b-2 border-blue-500 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Engine 02: Cross-Sell Graph
            </button>
            <button
              onClick={() => setActiveEngine('CAMPAIGN')}
              className={`pb-3 transition-all ${
                activeEngine === 'CAMPAIGN'
                  ? 'text-blue-400 border-b-2 border-blue-500 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Engine 03: Campaign Orchestrator
            </button>
          </div>

          {/* Opportunity List */}
          {loading ? (
            <div className="flex items-center justify-center p-12 text-blue-400 space-x-2 font-mono text-xs">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Querying SQLite product relationship graphs...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {opportunities
                .filter((opp) => activeEngine === 'ALL' || opp.type === activeEngine)
                .map((opp, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] space-y-4 shadow-lg hover:border-blue-500/40 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f2433] pb-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            {opp.type} ENGINE
                          </span>
                          <span className="text-xs font-mono text-gray-400">Confidence: {Math.round(opp.confidence * 100)}%</span>
                        </div>
                        <h3 className="text-lg font-bold text-white pt-1">{opp.title}</h3>
                      </div>

                      <div className="text-left sm:text-right">
                        <div className="text-xs font-mono text-gray-400">MODELLED ESTIMATE IMPACT</div>
                        <div className="text-xl font-black text-emerald-400">+₹{opp.estimatedRevenueImpact?.toLocaleString()}</div>
                      </div>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed font-sans">{opp.description}</p>

                    {/* Deterministic Calculation Inputs Breakdown */}
                    {opp.calculationInputs && (
                      <div className="p-4 rounded-xl bg-[#181b26] border border-[#2a3044] space-y-2 text-xs font-mono">
                        <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                          Phase 4.1 Deterministic Calculation Breakdown
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-gray-300">
                          <div>Eligible Customers: <span className="font-bold text-white">{opp.calculationInputs.eligibleCustomers}</span></div>
                          <div>Baseline Conv: <span className="font-bold text-white">{opp.calculationInputs.baselineConversionRate * 100}%</span></div>
                          <div>Modeled Conv: <span className="font-bold text-white">{opp.calculationInputs.modeledConversionRate * 100}%</span></div>
                          <div>Avg Basket: <span className="font-bold text-white">₹{opp.calculationInputs.averageBasketValue}</span></div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-gray-500 font-mono">
                        Requires Merchant Authorization: {opp.requiresMerchantApproval ? 'YES' : 'NO'}
                      </span>

                      <Link
                        href="/buyer"
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all"
                      >
                        <span>Test in AI Buyer</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </main>
      </div>

      {showDemoTour && <DemoTour onClose={() => setShowDemoTour(false)} />}
    </div>
  );
}
