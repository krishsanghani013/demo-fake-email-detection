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
  RotateCcw,
  Sparkles,
  Clock,
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
        <h1 className="text-xl font-bold tracking-tight text-[#F4F4F5]">
          Platform Configuration & Methodology
        </h1>
        <p className="text-xs text-[#71717A]">
          Forensic risk engine weights, AI model bounds & security telemetry parameters
        </p>
      </div>

      {/* Grid of Settings Panels */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Risk Engine Weights */}
        <div className="rounded-xl border border-[#27272A] bg-[#111113] p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#27272A] pb-3 text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
            <Shield className="h-4 w-4 text-indigo-400" />
            <span>Deterministic Risk Engine Weights</span>
          </div>

          <div className="space-y-3 text-xs text-[#A1A1AA]">
            <div className="flex items-center justify-between">
              <span>Threat Intelligence Artifacts (Max: 30 pts)</span>
              <span className="font-mono text-[#F4F4F5] font-semibold">30%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#18181B]">
              <div className="h-full bg-rose-500 rounded-full" style={{ width: "30%" }} />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span>AI Content & Deception Patterns (Max: 30 pts)</span>
              <span className="font-mono text-[#F4F4F5] font-semibold">30%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#18181B]">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: "30%" }} />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span>Technical Authentication SPF/DKIM/DMARC (Max: 25 pts)</span>
              <span className="font-mono text-[#F4F4F5] font-semibold">25%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#18181B]">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: "25%" }} />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span>Identity & Routing Consistency (Max: 15 pts)</span>
              <span className="font-mono text-[#F4F4F5] font-semibold">15%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#18181B]">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: "15%" }} />
            </div>
          </div>
        </div>

        {/* AI & Infrastructure Settings */}
        <div className="rounded-xl border border-[#27272A] bg-[#111113] p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#27272A] pb-3 text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
            <Cpu className="h-4 w-4 text-emerald-400" />
            <span>AI Model & Safety Parameters</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between rounded-lg bg-[#18181B] p-2.5 border border-[#27272A]">
              <div>
                <p className="font-medium text-[#F4F4F5]">Primary Model</p>
                <p className="text-[11px] text-[#71717A]">Optimized text forensics</p>
              </div>
              <span className="font-mono text-indigo-400 text-xs font-semibold">
                gemini-3.7-flash
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[#18181B] p-2.5 border border-[#27272A]">
              <div>
                <p className="font-medium text-[#F4F4F5]">Single-Request Protocol</p>
                <p className="text-[11px] text-[#71717A]">Token conservation guarantee</p>
              </div>
              <span className="font-mono text-emerald-400 text-xs font-semibold">
                1 Request / Scan
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[#18181B] p-2.5 border border-[#27272A]">
              <div>
                <p className="font-medium text-[#F4F4F5]">Data Privacy & Sanitization</p>
                <p className="text-[11px] text-[#71717A]">Client-side secret filtering</p>
              </div>
              <span className="font-mono text-emerald-400 text-xs font-semibold">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* AI Quota & Rate Limit Window Management */}
        <div className="rounded-xl border border-[#27272A] bg-[#111113] p-5 shadow-2xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span>AI Quota & Rate Limit Telemetry (12-Hour Rolling Window)</span>
            </div>
            <button
              type="button"
              onClick={() => quota.reset()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#3F3F46] bg-[#18181B] px-2.5 py-1 text-xs font-medium text-[#F4F4F5] hover:bg-[#27272A] hover:border-indigo-500/50 transition-all"
            >
              <RotateCcw className="h-3 w-3 text-indigo-400" />
              <span>Reset Quota (0 / {quota.limit})</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg bg-[#18181B] p-3 border border-[#27272A] space-y-1">
              <span className="text-[11px] text-[#71717A]">Quota Consumed</span>
              <p className="text-base font-bold font-mono text-[#F4F4F5]">
                {quota.used} / {quota.limit}{" "}
                <span className="text-xs font-normal text-[#A1A1AA]">analyses</span>
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#27272A]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    quota.isExhausted
                      ? "bg-rose-500"
                      : quota.percentage >= 80
                      ? "bg-amber-500"
                      : "bg-indigo-500"
                  }`}
                  style={{ width: `${quota.percentage}%` }}
                />
              </div>
            </div>

            <div className="rounded-lg bg-[#18181B] p-3 border border-[#27272A] space-y-1">
              <span className="text-[11px] text-[#71717A]">Remaining In Window</span>
              <p className="text-base font-bold font-mono text-emerald-400">
                {quota.remaining}{" "}
                <span className="text-xs font-normal text-[#A1A1AA]">available</span>
              </p>
              <p className="text-[10px] text-[#71717A]">
                Cap: {quota.limit} investigations / 12h
              </p>
            </div>

            <div className="rounded-lg bg-[#18181B] p-3 border border-[#27272A] space-y-1">
              <span className="text-[11px] text-[#71717A] flex items-center gap-1">
                <Clock className="h-3 w-3 text-indigo-400" />
                <span>Next Auto-Reset</span>
              </span>
              <p className="text-base font-bold font-mono text-indigo-400">
                in {quota.formattedTimeRemaining}
              </p>
              <p className="text-[10px] text-[#71717A]">
                Auto-resets every 12 hours
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
