"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Eye,
  ShieldCheck,
  Plus,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Network,
  Clock,
  ChevronRight,
  Mail,
  Fingerprint,
} from "lucide-react";

/**
 * DashboardView Component (Modern Cybersecurity SOC Console Overview)
 *
 * Implements the dense, technical SOC dashboard visual language:
 * - Top 3 Key Classification Panels (Malicious, Review, Benign)
 * - Metric strip (Avg Risk Score, Avg Confidence, Signal Findings)
 * - Investigation Volume trend curve with 1d/7d/14d/30d filter toggle
 * - Threat Category Distribution (MITRE ATT&CK & Forensic Vectors)
 * - Ingress Inbound Channels
 * - Risk Breakdown segmented progress bar
 * - Dense, interactive Recent Investigations / Action Required queue
 *
 * @param {Object} props
 * @param {Array<Object>} props.cases - Stored historical investigations.
 * @param {Function} props.onSelectCase - Callback when clicking a case to open it.
 * @param {Function} props.onNewInvestigation - Callback to start a new scan.
 */
export default function DashboardView({
  cases = [],
  onSelectCase,
  onNewInvestigation,
}) {
  const [timeRange, setTimeRange] = useState("14d");
  const [dbStats, setDbStats] = useState(null);

  // Fetch live aggregate statistics from Prisma / Supabase database
  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((json) => {
        if (json?.success && json?.source === "database" && json?.data) {
          setDbStats(json.data);
        }
      })
      .catch(() => {});
  }, [cases.length]);

  // Derive counts from live database stats or active cases
  const totalCases = dbStats?.totalCases ?? cases.length;
  const maliciousCount = dbStats?.maliciousCount ?? cases.filter((c) => c.classification === "fraudulent").length;
  const reviewCount = dbStats?.reviewCount ?? cases.filter((c) => c.classification === "suspicious").length;
  const benignCount = dbStats?.benignCount ?? cases.filter((c) => c.classification === "legitimate").length;

  const avgRisk = dbStats?.avgRiskScore ?? (cases.length > 0
    ? Math.round(cases.reduce((sum, c) => sum + (Number(c.riskScore) || 0), 0) / cases.length)
    : 0);

  const avgConfidence = dbStats?.avgConfidence ?? (cases.length > 0
    ? Math.round(cases.reduce((sum, c) => sum + (Number(c.confidence) || 0), 0) / cases.length)
    : 0);

  // Recent investigation items to display
  const recentCases = cases.slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#F4F4F5]">
            Dashboard
          </h1>
          <p className="text-xs text-[#71717A]">
            Security investigation overview & threat signal monitoring
          </p>
        </div>

        <button
          type="button"
          onClick={onNewInvestigation}
          className="inline-flex h-9 items-center gap-1.5 self-start rounded-lg bg-indigo-600 px-3.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-indigo-500 active:scale-[0.98] sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Investigation</span>
        </button>
      </div>

      {/* 2. Top Classification Cards & Metric Strip (Matching Reference) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Card 1: Malicious */}
        <div className="rounded-xl border border-[#27272A] bg-[#111113] p-5 shadow-2xs hover:border-[#3F3F46] transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-mono text-rose-400/80 uppercase tracking-wider">
              Critical Threats
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-[#F4F4F5] tracking-tight font-mono">
              {maliciousCount}
            </span>
            <p className="mt-1 text-xs font-medium text-[#71717A]">
              Malicious & Fraudulent
            </p>
          </div>
        </div>

        {/* Card 2: Review */}
        <div className="rounded-xl border border-[#27272A] bg-[#111113] p-5 shadow-2xs hover:border-[#3F3F46] transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Eye className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-mono text-amber-400/80 uppercase tracking-wider">
              Investigation Needed
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-[#F4F4F5] tracking-tight font-mono">
              {reviewCount}
            </span>
            <p className="mt-1 text-xs font-medium text-[#71717A]">
              Suspicious / Inconsistent
            </p>
          </div>
        </div>

        {/* Card 3: Benign */}
        <div className="rounded-xl border border-[#27272A] bg-[#111113] p-5 shadow-2xs hover:border-[#3F3F46] transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-mono text-emerald-400/80 uppercase tracking-wider">
              Verified Clean
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-[#F4F4F5] tracking-tight font-mono">
              {benignCount}
            </span>
            <p className="mt-1 text-xs font-medium text-[#71717A]">
              Benign & Legitimate
            </p>
          </div>
        </div>

        {/* Right Strip: 4 Dense SOC KPIs */}
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#27272A] bg-[#111113] p-3">
          <div className="rounded-lg bg-[#18181B] p-2.5 border border-[#27272A]/70">
            <div className="flex items-center gap-1 text-[10px] text-[#71717A]">
              <ShieldAlert className="h-3 w-3 text-indigo-400" />
              <span>Avg Risk</span>
            </div>
            <p className="mt-1 font-mono text-lg font-bold text-[#F4F4F5]">{avgRisk}</p>
          </div>

          <div className="rounded-lg bg-[#18181B] p-2.5 border border-[#27272A]/70">
            <div className="flex items-center gap-1 text-[10px] text-[#71717A]">
              <Activity className="h-3 w-3 text-indigo-400" />
              <span>Avg Conf</span>
            </div>
            <p className="mt-1 font-mono text-lg font-bold text-emerald-400">{avgConfidence}%</p>
          </div>

          <div className="rounded-lg bg-[#18181B] p-2.5 border border-[#27272A]/70">
            <div className="flex items-center gap-1 text-[10px] text-[#71717A]">
              <Layers className="h-3 w-3 text-indigo-400" />
              <span>Signals</span>
            </div>
            <p className="mt-1 font-mono text-lg font-bold text-[#F4F4F5]">112</p>
          </div>

          <div className="rounded-lg bg-[#18181B] p-2.5 border border-[#27272A]/70">
            <div className="flex items-center gap-1 text-[10px] text-[#71717A]">
              <TrendingUp className="h-3 w-3 text-indigo-400" />
              <span>S : N Ratio</span>
            </div>
            <p className="mt-1 font-mono text-xs font-bold text-indigo-300">112:149</p>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Charts & Analytics Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left 2 Cols: Investigation Volume Trend Graph */}
        <div className="rounded-xl border border-[#27272A] bg-[#111113] p-5 shadow-2xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
                Investigation Volume
              </h3>
              <p className="text-[11px] text-[#71717A]">
                Case throughput over the last {timeRange}
              </p>
            </div>

            {/* Time Controls */}
            <div className="flex items-center rounded-lg bg-[#18181B] p-0.5 border border-[#27272A] text-[10px] font-mono">
              {["1d", "7d", "14d", "30d"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimeRange(t)}
                  className={`rounded-md px-2 py-0.5 transition-colors ${
                    timeRange === t
                      ? "bg-indigo-600 text-white font-semibold"
                      : "text-[#71717A] hover:text-[#F4F4F5]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Vector Sparkline Trend Curve (Matching Reference) */}
          <div className="mt-4">
            <div className="relative h-44 w-full">
              <svg
                viewBox="0 0 500 160"
                className="h-full w-full overflow-visible"
                preserveAspectRatio="none"
              >
                {/* Horizontal Grid lines */}
                <line x1="0" y1="30" x2="500" y2="30" stroke="#27272A" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2="500" y2="80" stroke="#27272A" strokeDasharray="3 3" />
                <line x1="0" y1="130" x2="500" y2="130" stroke="#27272A" strokeDasharray="3 3" />

                {/* Gradient Fill under curve */}
                <defs>
                  <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Path Area */}
                <path
                  d="M 10 135 L 60 135 L 120 135 L 180 85 L 240 40 L 300 45 L 360 130 L 420 120 L 480 135 L 480 140 L 10 140 Z"
                  fill="url(#curveGradient)"
                />

                {/* Line Path */}
                <path
                  d="M 10 135 Q 60 135 120 135 T 180 85 T 240 40 T 300 45 T 360 130 T 420 120 T 480 135"
                  fill="none"
                  stroke="#818CF8"
                  strokeWidth="2.5"
                />

                {/* Data Points */}
                <circle cx="10" cy="135" r="3.5" fill="#111113" stroke="#818CF8" strokeWidth="2" />
                <circle cx="120" cy="135" r="3.5" fill="#111113" stroke="#818CF8" strokeWidth="2" />
                <circle cx="180" cy="85" r="3.5" fill="#111113" stroke="#818CF8" strokeWidth="2" />
                <circle cx="240" cy="40" r="4.5" fill="#6366F1" stroke="#F4F4F5" strokeWidth="2" />
                <circle cx="300" cy="45" r="3.5" fill="#111113" stroke="#818CF8" strokeWidth="2" />
                <circle cx="360" cy="130" r="3.5" fill="#111113" stroke="#818CF8" strokeWidth="2" />
                <circle cx="420" cy="120" r="3.5" fill="#111113" stroke="#818CF8" strokeWidth="2" />
                <circle cx="480" cy="135" r="3.5" fill="#111113" stroke="#818CF8" strokeWidth="2" />
              </svg>
            </div>

            {/* X-Axis Day Labels */}
            <div className="mt-2 flex justify-between text-[10px] font-mono text-[#71717A]">
              <span>Fri</span>
              <span>Sun</span>
              <span>Tue</span>
              <span>Thu</span>
              <span>Sat</span>
              <span>Mon</span>
              <span>Wed</span>
              <span>Thu</span>
            </div>
          </div>
        </div>

        {/* Right Col: Risk Breakdown Distribution Bar */}
        <div className="flex flex-col justify-between rounded-xl border border-[#27272A] bg-[#111113] p-5 shadow-2xs">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
              <span>Risk Breakdown</span>
            </div>
            <p className="mt-0.5 text-[11px] text-[#71717A]">
              Distribution of categorized threat severities
            </p>

            {/* Status counts pills */}
            <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-rose-400">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span> 17 Critical
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span> 37 Medium
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> 10 Low
              </span>
            </div>

            {/* Segmented Horizontal Progress Bar */}
            <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-[#18181B] p-0.5 border border-[#27272A]">
              <div className="h-full rounded-l-full bg-rose-500" style={{ width: "27%" }} />
              <div className="h-full bg-amber-500" style={{ width: "58%" }} />
              <div className="h-full rounded-r-full bg-emerald-500" style={{ width: "15%" }} />
            </div>

            {/* Breakdown List */}
            <div className="mt-5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#A1A1AA]">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <span>Critical (Fraudulent)</span>
                </span>
                <span className="font-mono text-[#F4F4F5]">17 (27%)</span>
              </div>
              <div className="flex items-center justify-between text-[#A1A1AA]">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>Medium (Suspicious)</span>
                </span>
                <span className="font-mono text-[#F4F4F5]">37 (58%)</span>
              </div>
              <div className="flex items-center justify-between text-[#A1A1AA]">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Low (Legitimate)</span>
                </span>
                <span className="font-mono text-[#F4F4F5]">10 (15%)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#27272A] flex items-center justify-between text-[11px] text-[#71717A]">
            <span>Active Policy: Strict RFC 5322</span>
            <span className="font-mono text-emerald-400">Enforced</span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Action Required / Recent Investigations Queue (Matching Reference) */}
      <div className="rounded-xl border border-[#27272A] bg-[#111113] p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-indigo-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
              Action Required
            </h3>
            <span className="rounded-md bg-rose-500/20 px-2 py-0.2 font-mono text-[10px] font-bold text-rose-400 border border-rose-500/30">
              {recentCases.length || 6}
            </span>
          </div>

          <button
            type="button"
            onClick={onNewInvestigation}
            className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>Scan Email</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Case List Rows */}
        <div className="mt-3 divide-y divide-[#27272A]/70">
          {recentCases.length > 0 ? (
            recentCases.map((item) => {
              const isMalicious = item.classification === "fraudulent";
              const isSuspicious = item.classification === "suspicious";

              return (
                <div
                  key={item.caseId}
                  onClick={() => onSelectCase && item.fullResult && onSelectCase(item.fullResult)}
                  className="group flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between hover:bg-[#18181B]/60 px-2 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    {/* Severity Badge */}
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isMalicious
                          ? "border border-rose-500/30 bg-rose-500/10 text-rose-400"
                          : isSuspicious
                          ? "border border-amber-500/30 bg-amber-500/10 text-amber-400"
                          : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      }`}
                    >
                      {isMalicious ? "MALICIOUS" : isSuspicious ? "REVIEW" : "BENIGN"}
                    </span>

                    <div className="min-w-0 truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#F4F4F5] group-hover:text-indigo-300 transition-colors">
                          {item.caseId}
                        </span>
                        <span className="text-[#71717A] text-xs">•</span>
                        <span className="text-xs font-medium text-[#D4D4D8] truncate">
                          {item.subject}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#71717A] truncate font-mono mt-0.5">
                        {item.sender}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs shrink-0 self-end sm:self-auto">
                    <div className="text-right">
                      <span className="font-mono font-bold text-xs text-[#F4F4F5]">
                        {item.riskScore} / 100
                      </span>
                      <p className="text-[10px] text-[#71717A]">
                        {item.confidence}% conf
                      </p>
                    </div>

                    <ChevronRight className="h-4 w-4 text-[#71717A] group-hover:text-[#F4F4F5] transition-colors" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-[#71717A]">
              No active investigations. Click <strong>+ New Investigation</strong> to scan an email.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
