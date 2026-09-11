"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Eye,
  ShieldCheck,
  Plus,
  ArrowRight,
  Activity,
  Layers,
  Clock,
  ChevronRight,
  Mail,
  Fingerprint,
  Shield,
  FileText,
  AlertTriangle,
  FolderSearch,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import RiskBadge from "@/components/Analysis/RiskBadge";
import EmptyState from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";

/**
 * DashboardView Component (Modern Cybersecurity SOC Console Overview)
 *
 * Implements clean, professional SOC visual hierarchy:
 * - 4 Key Metric KPI Cards (Total, Critical, Suspicious, Avg Risk)
 * - Dynamic Risk Distribution meter calculated from actual cases
 * - Real Threat Category detection frequency
 * - Recent Investigations queue with responsive layout
 * - Elegant Empty State for zero-case accounts (no fake data)
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
  const [dbStats, setDbStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Fetch live aggregate statistics from Prisma / Supabase database
  useEffect(() => {
    let isMounted = true;
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json?.success && json?.data) {
          setDbStats(json.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingStats(false);
      });

    return () => {
      isMounted = false;
    };
  }, [cases.length]);

  // Derive counts strictly from database or verified cases (no fake fallbacks)
  const totalCases = dbStats?.totalCases ?? cases.length;
  const maliciousCount =
    dbStats?.maliciousCount ??
    cases.filter((c) => c.classification === "fraudulent").length;
  const reviewCount =
    dbStats?.reviewCount ??
    cases.filter((c) => c.classification === "suspicious").length;
  const benignCount =
    dbStats?.benignCount ??
    cases.filter((c) => c.classification === "legitimate").length;

  const avgRisk =
    dbStats?.avgRiskScore ??
    (cases.length > 0
      ? Math.round(
          cases.reduce((sum, c) => sum + (Number(c.riskScore) || 0), 0) /
            cases.length
        )
      : 0);

  // Calculate real risk percentages for the distribution meter
  const critPercent =
    totalCases > 0 ? Math.round((maliciousCount / totalCases) * 100) : 0;
  const suspPercent =
    totalCases > 0 ? Math.round((reviewCount / totalCases) * 100) : 0;
  const cleanPercent =
    totalCases > 0 ? Math.round((benignCount / totalCases) * 100) : 0;

  // Extract detected threat vectors from real cases
  const detectedVectors = {};
  cases.forEach((c) => {
    const evidenceItems = c.fullResult?.evidence || c.evidence || [];
    evidenceItems.forEach((ev) => {
      const type = ev.type || ev.category || "General Threat";
      const formatted = type
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      detectedVectors[formatted] = (detectedVectors[formatted] || 0) + 1;
    });
  });

  const vectorEntries = Object.entries(detectedVectors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Recent investigation items to display
  const recentCases = cases.slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#F8FAFC]">
            Security Overview
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Monitor your email forensic investigations, threat indicators, and risk posture.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewInvestigation}
          className="inline-flex h-9 items-center gap-2 self-start rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-500 active:scale-[0.98] sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Analyze Email</span>
        </button>
      </div>

      {/* 2. Top 4 KPI Cards */}
      {isLoadingStats && cases.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Investigations"
            value={totalCases}
            subtitle="Analyzed email cases"
            icon={Shield}
            variant="default"
            badge="Telemetry"
          />
          <StatCard
            title="Critical Threats"
            value={maliciousCount}
            subtitle="Phishing & Fraud"
            icon={ShieldAlert}
            variant="critical"
            badge="Action Req"
          />
          <StatCard
            title="High / Suspicious Risk"
            value={reviewCount}
            subtitle="Pending triage"
            icon={Eye}
            variant="warning"
            badge="Review"
          />
          <StatCard
            title="Average Risk Score"
            value={`${avgRisk} / 100`}
            subtitle="Composite threat index"
            icon={Activity}
            variant={avgRisk >= 75 ? "critical" : avgRisk >= 40 ? "warning" : "success"}
            badge="Score"
          />
        </div>
      )}

      {/* 3. Main Dashboard Body: Either Empty State or Active SOC Telemetry */}
      {totalCases === 0 ? (
        <EmptyState
          icon={FolderSearch}
          title="No Investigations Recorded Yet"
          description="You haven't analyzed any emails yet. Paste raw headers or upload an RFC 5322 .eml file to initiate automated forensic analysis, header verification, and threat intelligence correlation."
          actionLabel="Analyze Your First Email"
          onAction={onNewInvestigation}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left 2 Cols: Risk Distribution & Recent Investigations Queue */}
          <div className="space-y-6 lg:col-span-2">
            {/* Risk Distribution Breakdown */}
            <div className="rounded-xl border border-[#1C2436] bg-[#111723] p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#1C2436] pb-3">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F8FAFC]">
                    Risk Classification Distribution
                  </h3>
                  <p className="text-[11px] text-[#94A3B8]">
                    Proportion of analyzed emails by severity tier
                  </p>
                </div>
                <span className="font-mono text-xs text-[#94A3B8]">
                  {totalCases} Cases
                </span>
              </div>

              {/* Multi-segment Progress Bar */}
              <div className="mt-4 space-y-2">
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#161D2D]">
                  {critPercent > 0 && (
                    <div
                      className="bg-rose-500 transition-all duration-500"
                      style={{ width: `${critPercent}%` }}
                      title={`Critical / Phishing: ${critPercent}% (${maliciousCount})`}
                    />
                  )}
                  {suspPercent > 0 && (
                    <div
                      className="bg-amber-500 transition-all duration-500"
                      style={{ width: `${suspPercent}%` }}
                      title={`Suspicious: ${suspPercent}% (${reviewCount})`}
                    />
                  )}
                  {cleanPercent > 0 && (
                    <div
                      className="bg-emerald-500 transition-all duration-500"
                      style={{ width: `${cleanPercent}%` }}
                      title={`Clean / Benign: ${cleanPercent}% (${benignCount})`}
                    />
                  )}
                </div>

                {/* Legend */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-xs bg-rose-500" />
                    <span className="text-[#94A3B8]">Critical:</span>
                    <span className="font-mono font-semibold text-[#F8FAFC]">
                      {maliciousCount} ({critPercent}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-xs bg-amber-500" />
                    <span className="text-[#94A3B8]">Suspicious:</span>
                    <span className="font-mono font-semibold text-[#F8FAFC]">
                      {reviewCount} ({suspPercent}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500" />
                    <span className="text-[#94A3B8]">Clean:</span>
                    <span className="font-mono font-semibold text-[#F8FAFC]">
                      {benignCount} ({cleanPercent}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Investigations Queue Table */}
            <div className="rounded-xl border border-[#1C2436] bg-[#111723] p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#1C2436] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#161D2D] text-blue-400 border border-[#253046]">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F8FAFC]">
                      Recent Investigations
                    </h3>
                    <p className="text-[11px] text-[#94A3B8]">
                      Most recent security scans and case telemetry
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onNewInvestigation}
                  className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                  <span>New Scan</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {/* Responsive Case Table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1C2436] text-[11px] font-mono uppercase text-[#64748B]">
                      <th className="pb-2.5 font-medium">Case ID</th>
                      <th className="pb-2.5 font-medium">Subject / Sender</th>
                      <th className="pb-2.5 font-medium">Verdict</th>
                      <th className="pb-2.5 font-medium text-right">Score</th>
                      <th className="pb-2.5 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C2436]">
                    {recentCases.map((c) => {
                      const caseId = c.caseId || c.id || "UNKNOWN";
                      const subject = c.subject || c.metadata?.subject || "No Subject";
                      const sender = c.sender || c.metadata?.from || "Unknown Sender";
                      const score = Number(c.riskScore) || 0;
                      const classification = c.classification || "suspicious";

                      return (
                        <tr
                          key={caseId}
                          onClick={() => onSelectCase(c)}
                          className="group cursor-pointer hover:bg-[#161D2D]/60 transition-colors"
                        >
                          <td className="py-3 font-mono font-medium text-blue-400">
                            {caseId}
                          </td>
                          <td className="py-3 pr-4 max-w-[280px]">
                            <p className="truncate font-medium text-[#F8FAFC] group-hover:text-blue-300 transition-colors">
                              {subject}
                            </p>
                            <p className="truncate text-[11px] text-[#64748B]">
                              {sender}
                            </p>
                          </td>
                          <td className="py-3">
                            <RiskBadge
                              classification={classification}
                              size="sm"
                            />
                          </td>
                          <td className="py-3 text-right font-mono font-bold text-[#F8FAFC]">
                            <span
                              className={
                                score >= 75
                                  ? "text-rose-400"
                                  : score >= 40
                                  ? "text-amber-400"
                                  : "text-emerald-400"
                              }
                            >
                              {score}
                            </span>
                            <span className="text-[10px] text-[#64748B]">/100</span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectCase(c);
                              }}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[#94A3B8] hover:text-white hover:bg-[#1D263B] border border-[#253046] transition-colors"
                            >
                              <span>Inspect</span>
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right 1 Col: Real Detected Threat Vectors & Operational SOC Guidelines */}
          <div className="space-y-6">
            {/* Detected Attack Vectors Card */}
            <div className="rounded-xl border border-[#1C2436] bg-[#111723] p-5 shadow-2xs">
              <div className="flex items-center gap-2.5 border-b border-[#1C2436] pb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#161D2D] text-amber-400 border border-[#253046]">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F8FAFC]">
                    Top Threat Vectors
                  </h3>
                  <p className="text-[11px] text-[#94A3B8]">
                    Observed in your investigated cases
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {vectorEntries.length > 0 ? (
                  vectorEntries.map(([vectorName, count]) => (
                    <div
                      key={vectorName}
                      className="flex items-center justify-between rounded-lg bg-[#161D2D] p-2.5 border border-[#1C2436] text-xs"
                    >
                      <span className="font-medium text-[#F8FAFC] truncate pr-2">
                        {vectorName}
                      </span>
                      <span className="flex h-5 items-center justify-center rounded-md bg-[#1D263B] px-2 font-mono text-[11px] font-semibold text-blue-400 shrink-0">
                        {count} hits
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg bg-[#161D2D] p-3 text-center text-xs text-[#64748B]">
                    No threat vector signals recorded yet.
                  </div>
                )}
              </div>
            </div>

            {/* SOC Operational Checklist */}
            <div className="rounded-xl border border-[#1C2436] bg-[#111723] p-5 shadow-2xs space-y-3 text-xs">
              <div className="flex items-center gap-2 text-blue-400 font-semibold uppercase tracking-wider text-[11px]">
                <ShieldCheck className="h-4 w-4" />
                <span>Forensic Protocol</span>
              </div>
              <p className="text-[#94A3B8] leading-relaxed text-[11px]">
                Always verify SPF/DKIM alignment and cross-reference extracted URLs with Threat Intelligence before releasing quarantined messages.
              </p>
              <div className="pt-2 border-t border-[#1C2436] flex items-center justify-between text-[11px] text-[#64748B]">
                <span>Pipeline Engine</span>
                <span className="font-mono text-emerald-400">Gemini 2.5 + Deterministic</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
