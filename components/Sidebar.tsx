'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Zap, ShoppingBag, ShieldCheck, FileCode, Play, AlertTriangle, FileText } from 'lucide-react';

interface SidebarProps {
  onStartDemo?: () => void;
}

export default function Sidebar({ onStartDemo }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Command Center', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Revenue Agent', href: '/agent', icon: Zap },
    { label: 'AI Buyer Console', href: '/buyer', icon: ShoppingBag },
    { label: 'Commerce Passport', href: '/passport', icon: FileCode },
    { label: 'Transaction Safety', href: '/resilience', icon: ShieldCheck },
    { label: 'System Audit Console', href: '/audit', icon: FileText },
  ];

  return (
    <aside className="w-64 border-r border-[#1f2433] bg-[#0c0e15] flex flex-col justify-between hidden md:flex min-h-screen">
      <div className="p-6 space-y-6">
        {/* Brand Header */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-xl tracking-wider shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-all">
            RAY
          </div>
          <div>
            <div className="font-extrabold text-white text-base tracking-wide flex items-center gap-1.5">
              RAY
              <span className="px-1.5 py-0.5 text-[9px] uppercase font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium">AI Revenue & Commerce OS</p>
          </div>
        </Link>

        {/* Guided 3-Min Demo Action Button */}
        <button
          onClick={onStartDemo}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
        >
          <Play className="w-4 h-4 fill-current text-white" />
          <span>Launch 3-Min Demo</span>
        </button>

        {/* Navigation Items */}
        <nav className="space-y-1 pt-2">
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest px-3 mb-2">
            Core Operating System
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-[#151824]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-gray-500'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Merchant Profile Card */}
      <div className="p-4 border-t border-[#1f2433] bg-[#090a0f] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-xs">
              NR
            </div>
            <div>
              <div className="font-bold text-white text-xs">Nova Run</div>
              <div className="text-[10px] text-gray-500">Sports & Fitness</div>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Razorpay Test Mode Active"></span>
        </div>

        <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-gray-400 border-t border-[#1f2433]">
          <span>Razorpay Status:</span>
          <span className="text-emerald-400 font-semibold">● Test Mode</span>
        </div>
      </div>
    </aside>
  );
}
