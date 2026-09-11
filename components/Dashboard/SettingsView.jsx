"use client";

import React from "react";
import {
  Settings,
  Cpu,
  Shield,
  Zap,
  Lock,
  Layers,
  FileCheck,
  Server,
  Sparkles,
  Clock,
  Database,
} from "lucide-react";
import { useQuota } from "@/lib/quota";

/**
 * SettingsView Component (Platform Settings & Forensic Methodology)
 */
export default function SettingsView() {
  const quota = useQuota();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#F8FAFC]">
          Platform Configuration & SOC Methodology
        </h1>
        <p className="text-xs text-[#94A3B8]">
          Deterministic risk engine weights, AI model bounds & security telemetry parameters
        </p>
      </div>

      {/* Grid of Settings Panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Risk Engine Weights */}
        <div className="rounded-xl border border-[#1C2436] bg-[#111723] p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1C2436] pb-3 text-xs font-semibold uppercase tracking-wider text-[#F8FAFC]">
            <Shield className="h-4 w-4 text-blue-400" />
            <span>Deterministic Risk Engine Weights</span>
          </div>

          <div className="space-y-3.5 text-xs text-[#94A3B8]">
            <div>
              <div className="flex items-center justify-between pb-1">
                <span>Threat Intelligence Artifacts (Max: 30 pts)</span>
                <span className="font-mono text-[#F8FAFC] font-semibold">30%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#161D2D]">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: "30%" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between pb-1">
                <span>AI Content & Deception Patterns (Max: 30 pts)</span>
                <span className="font-mono text-[#F8FAFC] font-semibold">30%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#161D2D]">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "30%" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between pb-1">
                <span>Technical Authentication SPF/DKIM/DMARC (Max: 25 pts)</span>
                <span className="font-mono text-[#F8FAFC] font-semibold">25%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#161D2D]">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "25%" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between pb-1">
                <span>Identity & Routing Consistency (Max: 15 pts)</span>
                <span className="font-mono text-[#F8FAFC] font-semibold">15%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#161D2D]">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "15%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* AI & Infrastructure Settings */}
        <div className="rounded-xl border border-[#1C2436] bg-[#111723] p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1C2436] pb-3 text-xs font-semibold uppercase tracking-wider text-[#F8FAFC]">
            <Cpu className="h-4 w-4 text-emerald-400" />
            <span>AI Model & Safety Parameters</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between rounded-lg bg-[#161D2D] p-3 border border-[#1C2436]">
              <div>
                <p className="font-medium text-[#F8FAFC]">Primary Model</p>
                <p className="text-[11px] text-[#64748B]">Optimized text forensics</p>
              </div>
              <span className="font-mono text-blue-400 text-xs font-semibold">
                gemini-2.5-flash
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[#161D2D] p-3 border border-[#1C2436]">
              <div>
                <p className="font-medium text-[#F8FAFC]">Database Persistence</p>
                <p className="text-[11px] text-[#64748B]">User-isolated storage</p>
              </div>
              <span className="font-mono text-emerald-400 text-xs font-semibold">
                Supabase PostgreSQL
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[#161D2D] p-3 border border-[#1C2436]">
              <div>
                <p className="font-medium text-[#F8FAFC]">Authentication</p>
                <p className="text-[11px] text-[#64748B]">Identity & tenant boundary</p>
              </div>
              <span className="font-mono text-purple-400 text-xs font-semibold">
                Clerk Security
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
