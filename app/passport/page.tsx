'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import DemoTour from '@/components/DemoTour';
import { ShieldCheck, Code, Copy, CheckCircle2, ArrowRight, RefreshCw, Check, Play } from 'lucide-react';
import Link from 'next/link';

export default function CommercePassportPage() {
  const [passport, setPassport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'JSON' | 'CAPABILITIES'>('OVERVIEW');
  const [showDemoTour, setShowDemoTour] = useState(false);

  useEffect(() => {
    fetch('/api/agent/merchant/nova-run')
      .then((res) => res.json())
      .then((data) => {
        setPassport(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleCopyJson = () => {
    if (!passport) return;
    navigator.clipboard.writeText(JSON.stringify(passport, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-gray-100 flex font-sans">
      <Sidebar onStartDemo={() => setShowDemoTour(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="border-b border-[#1f2433] bg-[#0c0e15] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="font-bold text-white text-base">AI Commerce Passport</h1>
            <span className="px-2 py-0.5 text-[10px] uppercase font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
              Contract v1.0
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
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-blue-400 font-mono text-xs space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Generating AI Commerce Passport from SQLite DB...</span>
          </div>
        ) : (
          <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
            {/* HERO PASSPORT BANNER */}
            <div className="p-6 rounded-2xl bg-[#12141c] border border-blue-500/40 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/30">
                    ● AI COMMERCE READY
                  </span>
                  <span className="text-xs font-mono text-gray-400">Merchant Slug: {passport?.merchant?.slug}</span>
                </div>
                <h1 className="text-3xl font-extrabold text-white">{passport?.merchant?.name} Passport</h1>
                <p className="text-sm text-gray-400 max-w-xl">
                  This passport turns Nova Run into a machine-readable, discoverable, and transactable storefront for AI buyer agents.
                </p>
              </div>

              <div className="flex items-center space-x-4 bg-[#181b26] p-5 rounded-2xl border border-[#2a3044]">
                <div className="text-center">
                  <div className="text-4xl font-black text-emerald-400">{passport?.readiness?.totalScore}</div>
                  <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest pt-1">/ 100 SCORE</div>
                </div>
                <div className="h-10 w-px bg-[#2a3044]"></div>
                <div className="text-xs space-y-1">
                  <div className="text-white font-bold">Category: {passport?.merchant?.category}</div>
                  <div className="text-gray-400 font-mono">Currency: {passport?.merchant?.currency}</div>
                  <div className="text-emerald-400 font-mono text-[11px]">35 Products Indexed</div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[#1f2433] space-x-6 text-sm font-semibold">
              <button
                onClick={() => setActiveTab('OVERVIEW')}
                className={`pb-3 transition-all ${
                  activeTab === 'OVERVIEW'
                    ? 'text-blue-400 border-b-2 border-blue-500 font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Readiness Breakdown
              </button>
              <button
                onClick={() => setActiveTab('CAPABILITIES')}
                className={`pb-3 transition-all ${
                  activeTab === 'CAPABILITIES'
                    ? 'text-blue-400 border-b-2 border-blue-500 font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Commerce Capabilities
              </button>
              <button
                onClick={() => setActiveTab('JSON')}
                className={`pb-3 transition-all flex items-center space-x-1.5 ${
                  activeTab === 'JSON'
                    ? 'text-blue-400 border-b-2 border-blue-500 font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Code className="w-4 h-4" />
                <span>Live Machine Contract JSON</span>
              </button>
            </div>

            {/* TAB 1: READINESS BREAKDOWN */}
            {activeTab === 'OVERVIEW' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {passport?.readiness?.dimensions?.map((dim: any, idx: number) => (
                  <div key={idx} className="p-5 rounded-2xl bg-[#12141c] border border-[#1f2433] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-base">{dim.dimension}</span>
                      <span className="text-sm font-mono font-extrabold text-blue-400">
                        {dim.score} / {dim.maxScore}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300">{dim.explanation}</p>
                    <div className="text-[11px] font-mono text-gray-500 bg-[#181b26] p-2.5 rounded-lg border border-[#2a3044]">
                      💡 Recommendation: {dim.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2: CAPABILITIES */}
            {activeTab === 'CAPABILITIES' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] space-y-4">
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Permitted AI Agent Capabilities
                  </h3>
                  <div className="space-y-2 text-xs font-mono">
                    {passport?.commerce?.capabilities?.map((cap: string, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-[#181b26] border border-[#2a3044] text-emerald-300">
                        ✓ {cap}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] space-y-4">
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-rose-400" />
                    Explicitly Restricted Actions
                  </h3>
                  <div className="space-y-2 text-xs font-mono">
                    {passport?.commerce?.restrictedActions?.map((act: string, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
                        ✕ {act}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: LIVE JSON INSPECTOR */}
            {activeTab === 'JSON' && (
              <div className="p-6 rounded-2xl bg-[#12141c] border border-[#1f2433] space-y-4">
                <div className="flex items-center justify-between border-b border-[#1f2433] pb-4">
                  <div>
                    <span className="text-xs font-mono text-blue-400 uppercase tracking-wider">
                      Live Contract Endpoint
                    </span>
                    <h3 className="text-base font-bold text-white font-mono pt-1">
                      GET /api/agent/merchant/nova-run
                    </h3>
                  </div>

                  <button
                    onClick={handleCopyJson}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-2 transition-all"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Machine JSON</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-[#090a0f] p-5 rounded-xl border border-[#2a3044] font-mono text-xs text-emerald-400 overflow-x-auto max-h-[500px]">
                  <pre>{JSON.stringify(passport, null, 2)}</pre>
                </div>
              </div>
            )}
          </main>
        )}
      </div>

      {showDemoTour && <DemoTour onClose={() => setShowDemoTour(false)} />}
    </div>
  );
}
