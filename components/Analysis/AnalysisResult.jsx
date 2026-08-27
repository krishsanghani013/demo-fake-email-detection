"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
  FileJson,
  RotateCcw,
  Layers,
  Network,
  Share2,
  Clock,
  Mail,
  Fingerprint,
  Sparkles,
  Bot,
  Activity,
  ArrowLeft,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import RiskScore from "./RiskScore";
import ConfidenceScore from "./ConfidenceScore";
import RiskBreakdown from "./RiskBreakdown";
import AuthenticationCard from "./AuthenticationCard";
import ThreatIntelCard from "./ThreatIntelCard";
import EvidenceList from "./EvidenceList";
import AIExplanation from "./AIExplanation";
import Recommendation from "./Recommendation";
import InvestigationSummary from "@/components/Investigation/InvestigationSummary";
import EvidenceTimeline from "@/components/Investigation/EvidenceTimeline";
import EvidenceGraph from "@/components/Investigation/EvidenceGraph";
import ExportControls from "@/components/Reports/ExportControls";
import ForensicReport from "@/components/Reports/ForensicReport";
import { createInvestigationSnapshot } from "@/lib/investigationSnapshot";
import { exportJsonReport, exportPdfReport } from "@/lib/reportGenerator";

/**
 * AnalysisResult Component (Modern Dark Cybersecurity SOC Case Inspector)
 *
 * Provides a deep, dense, tabbed forensic investigation interface:
 * 1. Overview (Forensic Risk Hero, AI vs Unified Score, Why This Score, Key Findings)
 * 2. Email (RFC 5322 Metadata grid + safe plain text body)
 * 3. Authentication (SPF, DKIM, DMARC, ARC & Mail Server Hop Chain)
 * 4. Artifacts (URLs, Domains, IPs, Attachments)
 * 5. Threat Intel (URL/IP/Domain reputation lookups)
 * 6. Timeline (Vertical chronological event sequence)
 * 7. Evidence Graph (Directed relational graph)
 * 8. Report (Executive Briefing, JSON & Vector PDF download)
 *
 * @param {Object} props
 * @param {Object} props.result - Complete analysis result object.
 * @param {Function} [props.onBack] - Optional callback to return to dashboard/list.
 * @param {Function} [props.onNewScan] - Optional callback to start a new analysis.
 */
export default function AnalysisResult({ result, onBack, onNewScan }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isBodyExpanded, setIsBodyExpanded] = useState(false);
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  if (!result) return null;

  const {
    caseId = "EML-ACTIVE-SESSION",
    createdAt,
    classification = "suspicious",
    riskLevel = "medium",
    riskScore = 0,
    confidence = 0,
    indicators = [],
    summary = "",
    recommendation = "",
    authentication,
    identity,
    consistency,
    threatIntel,
    artifacts,
    breakdown = [],
    categoryScores = {},
    aiRiskScore,
    metadata = {},
    body = {},
    urls = [],
    attachments = [],
  } = result;

  const isMalicious = classification === "fraudulent";
  const isSuspicious = classification === "suspicious";

  // Fast Export Handlers
  const handleQuickExportJson = () => {
    try {
      setIsExportingJson(true);
      const snapshot = createInvestigationSnapshot(result);
      exportJsonReport(snapshot);
    } catch (err) {
      console.error("JSON Export Error:", err);
    } finally {
      setIsExportingJson(false);
    }
  };

  const handleQuickExportPdf = () => {
    try {
      setIsExportingPdf(true);
      const snapshot = createInvestigationSnapshot(result);
      exportPdfReport(snapshot);
    } catch (err) {
      console.error("PDF Export Error:", err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "email", label: "Email Content", icon: Mail },
    { id: "auth", label: "Authentication", icon: ShieldCheck },
    { id: "artifacts", label: "Artifacts", icon: Layers, badge: (artifacts?.urls?.length || 0) + (artifacts?.ips?.length || 0) },
    { id: "threat-intel", label: "Threat Intel", icon: Network },
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "graph", label: "Evidence Graph", icon: Share2 },
    { id: "report", label: "Forensic Report", icon: FileText },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Case Header & Top Action Toolbar */}
      <div className="flex flex-col gap-4 rounded-xl border border-[#27272A] bg-[#111113] p-5 shadow-2xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#27272A] pb-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#27272A] bg-[#18181B] text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-[#F4F4F5]">
                  CASE {caseId}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    isMalicious
                      ? "border border-rose-500/30 bg-rose-500/10 text-rose-400"
                      : isSuspicious
                      ? "border border-amber-500/30 bg-amber-500/10 text-amber-400"
                      : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isMalicious ? "bg-rose-500" : isSuspicious ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                  />
                  <span>{isMalicious ? "MALICIOUS" : isSuspicious ? "REVIEW" : "BENIGN"}</span>
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[#A1A1AA] truncate max-w-xl">
                {metadata.subject || "Email Forensics Investigation"}
              </p>
            </div>
          </div>

          {/* Action Triggers */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleQuickExportJson}
              disabled={isExportingJson}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#27272A] bg-[#18181B] px-3 text-xs font-semibold text-[#F4F4F5] shadow-2xs hover:bg-[#27272A] transition-colors"
            >
              <FileJson className="h-3.5 w-3.5 text-indigo-400" />
              <span>{isExportingJson ? "Exporting..." : "Export JSON"}</span>
            </button>

            <button
              type="button"
              onClick={handleQuickExportPdf}
              disabled={isExportingPdf}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#27272A] bg-[#18181B] px-3 text-xs font-semibold text-[#F4F4F5] shadow-2xs hover:bg-[#27272A] transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-emerald-400" />
              <span>{isExportingPdf ? "Generating..." : "Export PDF"}</span>
            </button>

            {onNewScan && (
              <button
                type="button"
                onClick={onNewScan}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>New Scan</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Email Metadata Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono text-[#A1A1AA]">
          <div className="truncate">
            <span className="text-[#71717A]">Sender: </span>
            <span className="text-[#F4F4F5]">{metadata.from || "Unknown"}</span>
          </div>
          <div className="truncate">
            <span className="text-[#71717A]">Recipient: </span>
            <span className="text-[#F4F4F5]">{metadata.to || "Unknown"}</span>
          </div>
          <div className="truncate sm:text-right">
            <span className="text-[#71717A]">Analyzed: </span>
            <span className="text-[#F4F4F5]">
              {createdAt ? new Date(createdAt).toLocaleString() : "Live Session"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Dense Tab Navigation Bar */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-[#27272A] bg-[#111113] p-1 text-xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 font-medium transition-all shrink-0 ${
                isActive
                  ? "bg-[#18181B] text-white border border-[#27272A] shadow-xs"
                  : "text-[#71717A] hover:bg-[#141417] hover:text-[#F4F4F5]"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-indigo-400" : ""}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="rounded-full bg-[#27272A] px-1.5 py-0.2 font-mono text-[9px] text-[#A1A1AA]">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Tab Content Panels */}
      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Forensic Risk Hero Panel */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Left 2 Cols: Unified Forensic Risk & AI vs Forensic Comparison */}
            <div className="flex flex-col justify-between rounded-xl border border-[#27272A] bg-[#111113] p-5 shadow-2xs lg:col-span-2 space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
                    Forensic Threat Assessment
                  </span>
                  <span className="font-mono text-[10px] text-[#71717A]">
                    Multi-Engine Convergence
                  </span>
                </div>

                {/* Score & Verdict Row */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A]">
                      Unified Forensic Risk Score
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span
                        className={`text-5xl font-extrabold font-mono tracking-tight ${
                          isMalicious
                            ? "text-rose-500"
                            : isSuspicious
                            ? "text-amber-500"
                            : "text-emerald-500"
                        }`}
                      >
                        {riskScore}
                      </span>
                      <span className="text-sm font-mono text-[#71717A]">/ 100</span>
                      <span
                        className={`ml-2 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isMalicious
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : isSuspicious
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {riskLevel} SEVERITY
                      </span>
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="rounded-lg bg-[#18181B] p-3 border border-[#27272A] min-w-[140px]">
                    <span className="text-[10px] text-[#71717A] uppercase font-semibold">
                      Signal Confidence
                    </span>
                    <p className="mt-1 font-mono text-xl font-bold text-emerald-400">
                      {confidence}%
                    </p>
                    <p className="text-[10px] text-[#71717A]">Signal Convergence</p>
                  </div>
                </div>
              </div>

              {/* Engine Comparison Strip */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#27272A] text-xs">
                <div className="rounded-lg bg-[#141417] p-2.5 border border-[#27272A]">
                  <div className="flex items-center gap-1.5 text-[#71717A] text-[11px]">
                    <Bot className="h-3.5 w-3.5 text-indigo-400" />
                    <span>AI Content Score</span>
                  </div>
                  <p className="mt-1 font-mono font-bold text-indigo-300">
                    {typeof aiRiskScore === "number" ? aiRiskScore : riskScore} / 100
                  </p>
                </div>

                <div className="rounded-lg bg-[#141417] p-2.5 border border-[#27272A]">
                  <div className="flex items-center gap-1.5 text-[#71717A] text-[11px]">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Technical Auth & Intel</span>
                  </div>
                  <p className="mt-1 font-mono font-bold text-[#F4F4F5]">
                    {categoryScores.threatIntelligence || 0 + (categoryScores.authentication || 0)} pts
                  </p>
                </div>
              </div>
            </div>

            {/* Right Col: Quick Findings & Recommendation */}
            <div className="flex flex-col justify-between rounded-xl border border-[#27272A] bg-[#111113] p-5 shadow-2xs space-y-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#F4F4F5] border-b border-[#27272A] pb-3 block">
                  Actionable Recommendation
                </span>
                <p className="mt-3 text-xs leading-relaxed text-[#D4D4D8]">
                  {recommendation || "Verify sender authenticity before taking action."}
                </p>
              </div>

              <div className="rounded-lg bg-[#18181B] p-3 border border-[#27272A] space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#71717A]">
                  Executive Overview
                </span>
                <p className="text-[11px] leading-relaxed text-[#A1A1AA] line-clamp-3">
                  {summary || "Forensic analysis completed."}
                </p>
              </div>
            </div>
          </div>

          {/* Why This Score? Section */}
          <RiskBreakdown
            breakdown={breakdown}
            categoryScores={categoryScores}
            riskScore={riskScore}
            aiRiskScore={aiRiskScore}
          />

          {/* Investigation Summary Briefing */}
          <InvestigationSummary result={result} />

          {/* AI Evidence Findings List */}
          <EvidenceList indicators={indicators} />
        </div>
      )}

      {/* TAB 2: EMAIL CONTENT */}
      {activeTab === "email" && (
        <div className="space-y-6">
          {/* RFC 5322 Metadata Table Grid */}
          <div className="rounded-xl border border-[#27272A] bg-[#111113] p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F4F4F5] border-b border-[#27272A] pb-3">
              RFC 5322 Email Header Metadata
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1 rounded-lg bg-[#141417] p-3 border border-[#27272A]">
                <span className="text-[10px] text-[#71717A] uppercase font-semibold">From</span>
                <p className="text-[#F4F4F5] break-all">{metadata.from || "Unknown"}</p>
              </div>

              <div className="space-y-1 rounded-lg bg-[#141417] p-3 border border-[#27272A]">
                <span className="text-[10px] text-[#71717A] uppercase font-semibold">To</span>
                <p className="text-[#F4F4F5] break-all">{metadata.to || "Unknown"}</p>
              </div>

              <div className="space-y-1 rounded-lg bg-[#141417] p-3 border border-[#27272A]">
                <span className="text-[10px] text-[#71717A] uppercase font-semibold">Reply-To</span>
                <p className="text-[#F4F4F5] break-all">{metadata.replyTo || "None specified"}</p>
              </div>

              <div className="space-y-1 rounded-lg bg-[#141417] p-3 border border-[#27272A]">
                <span className="text-[10px] text-[#71717A] uppercase font-semibold">Return-Path</span>
                <p className="text-[#F4F4F5] break-all">{metadata.returnPath || "None specified"}</p>
              </div>

              <div className="space-y-1 rounded-lg bg-[#141417] p-3 border border-[#27272A] md:col-span-2">
                <span className="text-[10px] text-[#71717A] uppercase font-semibold">Subject</span>
                <p className="text-[#F4F4F5] font-sans text-sm font-semibold">{metadata.subject || "No Subject"}</p>
              </div>

              <div className="space-y-1 rounded-lg bg-[#141417] p-3 border border-[#27272A]">
                <span className="text-[10px] text-[#71717A] uppercase font-semibold">Date Header</span>
                <p className="text-[#F4F4F5] break-all">{metadata.date || "Not recorded"}</p>
              </div>

              <div className="space-y-1 rounded-lg bg-[#141417] p-3 border border-[#27272A]">
                <span className="text-[10px] text-[#71717A] uppercase font-semibold">Message-ID</span>
                <p className="text-[#F4F4F5] break-all">{metadata.messageId || "None"}</p>
              </div>
            </div>
          </div>

          {/* Safe Plain Text Body Viewer */}
          <div className="rounded-xl border border-[#27272A] bg-[#111113] p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
                  Extracted Plain Text Body
                </h3>
                <p className="text-[11px] text-[#71717A]">
                  Safe sanitized text rendering (scripts neutralized)
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsBodyExpanded((prev) => !prev)}
                className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <span>{isBodyExpanded ? "Collapse" : "Expand All"}</span>
                {isBodyExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div
              className={`overflow-y-auto rounded-lg bg-[#09090B] p-4 font-mono text-xs leading-relaxed text-[#D4D4D8] border border-[#27272A] ${
                isBodyExpanded ? "max-h-[600px]" : "max-h-64"
              }`}
            >
              <pre className="whitespace-pre-wrap font-mono">{body?.text || result.formattedTextForAnalysis || "No plain text content extracted."}</pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUTHENTICATION */}
      {activeTab === "auth" && (
        <div className="space-y-6">
          <AuthenticationCard
            authentication={authentication}
            identity={identity}
            consistency={consistency}
          />
        </div>
      )}

      {/* TAB 4: ARTIFACTS */}
      {activeTab === "artifacts" && (
        <div className="space-y-6">
          <ThreatIntelCard threatIntel={threatIntel} artifacts={artifacts} />
        </div>
      )}

      {/* TAB 5: THREAT INTEL */}
      {activeTab === "threat-intel" && (
        <div className="space-y-6">
          <ThreatIntelCard threatIntel={threatIntel} artifacts={artifacts} />
        </div>
      )}

      {/* TAB 6: TIMELINE */}
      {activeTab === "timeline" && (
        <div className="space-y-6">
          <EvidenceTimeline result={result} />
        </div>
      )}

      {/* TAB 7: EVIDENCE GRAPH */}
      {activeTab === "graph" && (
        <div className="space-y-6">
          <EvidenceGraph result={result} />
        </div>
      )}

      {/* TAB 8: FORENSIC REPORT */}
      {activeTab === "report" && (
        <div className="space-y-6">
          <ExportControls result={result} />
          <ForensicReport result={result} />
        </div>
      )}
    </div>
  );
}
