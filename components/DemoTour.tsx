'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Pause, ChevronRight, ChevronLeft, X, ShieldCheck, Zap, ShoppingBag, FileCode, CheckCircle2, ArrowRight } from 'lucide-react';

interface DemoStep {
  stepNumber: number;
  title: string;
  route: string;
  duration: string;
  narration: string;
  highlightText: string;
  actionText?: string;
  actionRoute?: string;
}

const DEMO_STEPS: DemoStep[] = [
  {
    stepNumber: 1,
    title: 'Merchant Command Center',
    route: '/dashboard',
    duration: '20s',
    narration: 'RAY is an AI revenue and commerce operating system for merchants. It monitors catalog performance, customer behavior, and transaction safety in real-time.',
    highlightText: 'GMV Lift & AI Commerce Readiness metrics live from SQLite database.',
    actionText: 'Proceed to Revenue Agent',
  },
  {
    stepNumber: 2,
    title: 'Revenue Agent Intelligence',
    route: '/agent',
    duration: '25s',
    narration: 'RAY identifies where the merchant can grow revenue using its product relationship graph and customer purchase history.',
    highlightText: 'Nova Runner X1 Pro → Performance Anti-Blister Socks (42% historical attach rate, ₹4.2k modeled net impact).',
    actionText: 'Launch AI Buyer Experience',
  },
  {
    stepNumber: 3,
    title: 'AI Buyer Discovery & Unconstrained Search',
    route: '/buyer',
    duration: '35s',
    narration: 'An AI Buyer searches Nova Run catalog based on natural intent. RAY parses intent, searches candidates without hardcoded caps, and optimizes a basket to ₹4,498.',
    highlightText: 'Basket: Nova Runner X1 Pro (₹3,999) + Anti-Blister Socks (₹499) = ₹4,498.',
    actionText: 'Authorize Bounded Payment',
  },
  {
    stepNumber: 4,
    title: 'Bounded Transaction & Policy Gate',
    route: '/buyer',
    duration: '20s',
    narration: 'The Policy Engine evaluates ₹4,498 ≤ ₹5,000 cap -> POLICY PASSED. If a basket exceeds ₹5,000, Policy Engine blocks execution. The AI CANNOT touch money directly.',
    highlightText: 'Deterministic Guardrail: Policy Engine decision PASS. User checks authorization box.',
    actionText: 'Launch Razorpay Checkout',
  },
  {
    stepNumber: 5,
    title: 'Razorpay Test Checkout & HMAC Verification',
    route: '/test-payment',
    duration: '30s',
    narration: 'The official Razorpay Test Mode Checkout opens. Upon payment, the server verifies the HMAC-SHA256 signature using timing-safe comparison.',
    highlightText: 'Server Verification: Signature matched. Order status updated to PAID / CAPTURED in DB.',
    actionText: 'Test Failure & Idempotency',
  },
  {
    stepNumber: 6,
    title: 'Failure Simulation & Idempotency',
    route: '/resilience',
    duration: '20s',
    narration: 'Simulate a rapid double-click on Authorize. RAY detects duplicate actionId, reuses the original transaction state, and guarantees ₹0 duplicate charge.',
    highlightText: 'Resilience Score: 100/100 SAFETY. Rapid retries return original transaction without double charging.',
    actionText: 'View AI Commerce Passport',
  },
  {
    stepNumber: 7,
    title: 'AI Commerce Passport & Machine Contract',
    route: '/passport',
    duration: '20s',
    narration: 'Nova Run is 92/100 AI Ready. AI buyers discover capabilities, catalog, and policy limits via GET /api/agent/merchant/nova-run.',
    highlightText: 'Machine Contract: Structured JSON version 1.0 grounded 100% in database values.',
    actionText: 'Final Pitch Summary',
  },
  {
    stepNumber: 8,
    title: 'Final Summary: AI-Ready Commerce',
    route: '/',
    duration: '10s',
    narration: 'AI Discovery + Revenue Intelligence + Bounded Transactions + Fail-Closed Recovery = AI-Ready Commerce.',
    highlightText: 'RAY: "Turn every merchant into an AI-native storefront."',
    actionText: 'Restart Tour',
  },
];

interface DemoTourProps {
  onClose: () => void;
}

export default function DemoTour({ onClose }: DemoTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const router = useRouter();

  const step = DEMO_STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < DEMO_STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      router.push(DEMO_STEPS[nextIdx].route);
    } else {
      setCurrentStepIndex(0);
      router.push(DEMO_STEPS[0].route);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      router.push(DEMO_STEPS[prevIdx].route);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-lg w-full p-6 rounded-2xl bg-[#0e1017]/95 border-2 border-blue-500/60 backdrop-blur-xl shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-5">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#2a3044] pb-3">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
          <span className="font-mono text-xs font-bold text-blue-400 uppercase tracking-widest">
            3-MIN JUDGE DEMO MODE — STEP {step.stepNumber} OF {DEMO_STEPS.length}
          </span>
        </div>

        <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#1f2433]">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step Title & Narration */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-white text-base flex items-center gap-2">
            {step.title}
          </h3>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {step.duration}
          </span>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed font-sans">{step.narration}</p>

        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 font-mono text-[11px]">
          💡 <span className="font-bold">Judge Highlight:</span> {step.highlightText}
        </div>
      </div>

      {/* Controller Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-[#2a3044]">
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="p-2 rounded-lg bg-[#181b26] border border-[#2a3044] text-gray-300 hover:text-white disabled:opacity-30 text-xs font-bold flex items-center space-x-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>PREV</span>
          </button>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 rounded-lg bg-[#181b26] border border-[#2a3044] text-gray-300 hover:text-white text-xs font-bold flex items-center space-x-1"
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
          </button>
        </div>

        <button
          onClick={handleNext}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center space-x-1.5 transition-all"
        >
          <span>{step.actionText || 'NEXT'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
