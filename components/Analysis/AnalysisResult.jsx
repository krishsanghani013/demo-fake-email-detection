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
  Activity,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Download,
  AlertOctagon,
  Bot,
} from "lucide-react";
import RiskScore from "./RiskScore";
import ConfidenceScore from "./ConfidenceScore";
import RiskBadge from "./RiskBadge";
import WhyThisScore from "./WhyThisScore";
import AuthenticationCard from "./AuthenticationCard";
import ThreatIntelCard from "./ThreatIntelCard";
import EvidenceList from "./EvidenceList";
import EvidenceChain from "@/components/Investigation/EvidenceChain";
import EvidenceTimeline from "@/components/Investigation/EvidenceTimeline";
import EvidenceGraph from "@/components/Investigation/EvidenceGraph";
import ExportControls from "@/components/Reports/ExportControls";
import ForensicReport from "@/components/Reports/ForensicReport";
import CopyButton from "@/components/ui/CopyButton";
import { createInvestigationSnapshot } from "@/lib/investigationSnapshot";
import { exportJsonReport, exportPdfReport } from "@/lib/reportGenerator";

/**
 * AnalysisResult Component (Modern Dark Cybersecurity SOC Case Inspector)
 *
 * Provides a deep, professional forensic investigation interface:
 * 1. Overview (Unified Risk Gauge, Assessment Confidence, Evidence Chain, Recommendations)
 * 2. Email Content (RFC 5322 Metadata grid + safe plain text body)
 * 3. Authentication (SPF, DKIM, DMARC with accessible icons and explanations)
 * 4. Artifacts (URLs, Domains, IPs with one-click copy buttons)
 * 5. Threat Intel (Reputation feeds and IOC lookups)
 * 6. Timeline (Vertical chronological event sequence)
 * 7. Evidence Graph (Interactive relational graph)
 * 8. Report (Executive Briefing, printable dossier, PDF & JSON exports)
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
    verdict,
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
    evidence = [],
    breakdown = [],
    categoryScores = {},
    aiRiskScore,
    metadata = {},
    body = {},
  } = result;

  const safeEvidence =
    Array.isArray(evidence) && evidence.length > 0
      ? evidence
      : Array.isArray(breakdown)
      ? breakdown
      : [];

  const displayVerdict =
    verdict ||
    (classification === "fraudulent"
      ? "CRITICAL / PHISHING"
      : classification === "suspicious"
      ? "HIGH / SUSPICIOUS"
      : "LOW / LEGITIMATE");

  const isMalicious = classification === "fraudulent" || riskScore >= 75;
  const isSuspicious = classification === "suspicious" || (riskScore >= 25 && riskScore < 75);

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
    { id: "overview", label: "Overview & Evidence Chain", icon: Activity },
    { id: "email", label: "Email Headers & Body", icon: Mail },
    { id: "auth", label: "Authentication Matrix", icon: ShieldCheck },
    {
      id: "artifacts",
      label: "Artifacts & IOCs",
      icon: Layers,
      badge:
        (artifacts?.urls?.length || 0) +
        (artifacts?.domains?.length || 0) +
        (artifacts?.ips?.length || 0),
    },
    { id: "threat-intel", label: "Threat Intelligence", icon: Network },
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "graph", label: "Evidence Graph", icon: Share2 },
    { id: "report", label: "Forensic Dossier", icon: FileText },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Case Header & Top Action Toolbar */}
      <div className="flex flex-col gap-4 rounded-xl border border-[#1C2436] bg-[#111723] p-5 shadow-2xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#1C2436] pb-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#253046] bg-[#161D2D] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1D263B] transition-colors"
                title="Back to Investigations"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-[#F8FAFC]">
                  CASE {caseId}
                </span>
                <CopyButton text={caseId} />

                <RiskBadge
                  classification={classification}
                  riskLevel={riskLevel}
                  size="sm"
                />
              </div>

              <p className="mt-1 text-xs text-[#94A3B8] truncate max-w-xl">
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
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#253046] bg-[#161D2D] px-3 text-xs font-semibold text-[#F8FAFC] shadow-2xs hover:bg-[#1D263B] transition-colors"
            >
              <FileJson className="h-3.5 w-3.5 text-blue-400" />
              <span>{isExportingJson ? "Exporting..." : "Export JSON"}</span>
            </button>

            <button
              type="button"
              onClick={handleQuickExportPdf}
              disabled={isExportingPdf}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#253046] bg-[#161D2D] px-3 text-xs font-semibold text-[#F8FAFC] shadow-2xs hover:bg-[#1D263B] transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-emerald-400" />
              <span>{isExportingPdf ? "Generating..." : "Download Report"}</span>
            </button>

            {onNewScan && (
              <button
                type="button"
                onClick={onNewScan}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white shadow-xs hover:bg-blue-500 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>New Scan</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Email Metadata Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono text-[#94A3B8]">
          <div className="truncate">
            <span className="text-[#64748B]">Sender: </span>
            <span className="text-[#F8FAFC]">{metadata.from || "Unknown"}</span>
          </div>
          <div className="truncate">
            <span className="text-[#64748B]">Recipient: </span>
            <span className="text-[#F8FAFC]">{metadata.to || "Unknown"}</span>
          </div>
          <div className="truncate sm:text-right">
            <span className="text-[#64748B]">Analyzed: </span>
            <span className="text-[#F8FAFC]">
              {createdAt ? new Date(createdAt).toLocaleString() : "Live Session"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Dense Tab Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-[#1C2436] bg-[#111723] p-1.5 text-xs">
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
                  ? "bg-[#161D2D] text-white border border-[#253046] shadow-xs"
                  : "text-[#94A3B8] hover:bg-[#161D2D]/50 hover:text-[#F8FAFC]"
              }`}
            >
              <Icon
                className={`h-3.5 w-3.5 ${isActive ? "text-blue-400" : ""}`}
              />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="rounded-full bg-[#1C2436] px-1.5 py-0.2 font-mono text-[9px] text-[#94A3B8]">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Tab Content Panels */}
      {/* TAB 1: OVERVIEW & EVIDENCE CHAIN */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top 3 Metric Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Metric 1: Risk Score (Circular Semi-Arc Gauge) */}
            <RiskScore
              riskScore={riskScore}
              riskLevel={riskLevel}
              classification={classification}
            />

            {/* Metric 2: Confidence Score */}
            <ConfidenceScore confidence={confidence} />

            {/* Metric 3: Actionable Recommendation Card */}
            <div className="flex flex-col justify-between rounded-2xl border border-[#1C2436] bg-[#111723] p-5 shadow-sm space-y-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] border-b border-[#1C2436] pb-2 block">
                  Actionable Recommendation
                </span>
                <p className="mt-2.5 text-xs leading-relaxed text-[#F8FAFC]">
                  {recommendation ||
                    "Verify sender authenticity through an out-of-band communication channel."}
                </p>
              </div>

              <div className="rounded-lg bg-[#161D2D] p-3 border border-[#1C2436] space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Executive Threat Summary
                </span>
                <p className="text-[11px] leading-relaxed text-[#94A3B8] line-clamp-3">
                  {summary || "Automated forensic email analysis completed."}
                </p>
              </div>
            </div>
          </div>

          {/* Prominent Vertical Evidence Chain */}
          <EvidenceChain
            evidence={safeEvidence}
            riskScore={riskScore}
            verdict={displayVerdict}
            riskLevel={riskLevel}
            authentication={authentication}
            identity={identity}
          />

          {/* Transparent Score Calculation Breakdown */}
          <WhyThisScore
            evidence={safeEvidence}
            categoryScores={categoryScores}
            riskScore={riskScore}
            riskLevel={riskLevel}
            verdict={displayVerdict}
            aiRiskScore={aiRiskScore}
          />

          {/* Detailed Forensic Findings List */}
          <EvidenceList evidence={safeEvidence} indicators={indicators} />
        </div>
      )}

      {/* TAB 2: EMAIL CONTENT */}
      {activeTab === "email" && (
        <div className="space-y-6">
          {/* RFC 5322 Metadata Table Grid */}
          <div className="rounded-xl border border-[#1C2436] bg-[#111723] p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F8FAFC] border-b border-[#1C2436] pb-3">
              RFC 5322 Email Header Metadata
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1 rounded-lg bg-[#161D2D] p-3 border border-[#1C2436]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold font-sans">
                    From Header
                  </span>
                  <CopyButton text={metadata.from} />
                </div>
                <p className="text-[#F8FAFC] break-all">{metadata.from || "Unknown"}</p>
              </div>

              <div className="space-y-1 rounded-lg bg-[#161D2D] p-3 border border-[#1C2436]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold font-sans">
                    To Header
                  </span>
                  <CopyButton text={metadata.to} />
                </div>
                <p className="text-[#F8FAFC] break-all">{metadata.to || "Unknown"}</p>
              </div>

              <div className="space-y-1 rounded-lg bg-[#161D2D] p-3 border border-[#1C2436]">
                <span className="text-[10px] text-[#64748B] uppercase font-semibold font-sans">
                  Reply-To Address
                </span>
                <p className="text-[#F8FAFC] break-all">
                  {metadata.replyTo || "None specified"}
                </p>
              </div>

              <div className="space-y-1 rounded-lg bg-[#161D2D] p-3 border border-[#1C2436]">
                <span className="text-[10px] text-[#64748B] uppercase font-semibold font-sans">
                  Return-Path Header
                </span>
                <p className="text-[#F8FAFC] break-all">
                  {metadata.returnPath || "None specified"}
                </p>
              </div>

              <div className="space-y-1 rounded-lg bg-[#161D2D] p-3 border border-[#1C2436] md:col-span-2">
                <span className="text-[10px] text-[#64748B] uppercase font-semibold font-sans">
                  Subject
                </span>
                <p className="text-[#F8FAFC] font-sans text-sm font-semibold">
                  {metadata.subject || "No Subject"}
                </p>
              </div>

              <div className="space-y-1 rounded-lg bg-[#161D2D] p-3 border border-[#1C2436]">
                <span className="text-[10px] text-[#64748B] uppercase font-semibold font-sans">
                  Date Header
                </span>
                <p className="text-[#F8FAFC] break-all">{metadata.date || "Not recorded"}</p>
              </div>

              <div className="space-y-1 rounded-lg bg-[#161D2D] p-3 border border-[#1C2436]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold font-sans">
                    Message-ID
                  </span>
                  <CopyButton text={metadata.messageId} />
                </div>
                <p className="text-[#F8FAFC] break-all">{metadata.messageId || "None"}</p>
              </div>
            </div>
          </div>

          {/* Safe Plain Text Body Viewer */}
          <div className="rounded-xl border border-[#1C2436] bg-[#111723] p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#1C2436] pb-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F8FAFC]">
                  Sanitized Plain Text Body
                </h3>
                <p className="text-[11px] text-[#94A3B8]">
                  Safe preview (HTML scripts, iframes, and active content neutralized)
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsBodyExpanded((prev) => !prev)}
                className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>{isBodyExpanded ? "Collapse" : "Expand All"}</span>
                {isBodyExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            <div
              className={`overflow-y-auto rounded-lg bg-[#0D111A] p-4 font-mono text-xs leading-relaxed text-[#D4D4D8] border border-[#1C2436] ${
                isBodyExpanded ? "max-h-[600px]" : "max-h-64"
              }`}
            >
              <pre className="whitespace-pre-wrap font-mono">
                {body?.text ||
                  result.formattedTextForAnalysis ||
                  "No plain text content extracted."}
              </pre>
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

      {/* TAB 4: ARTIFACTS & IOCS */}
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

      {/* TAB 8: FORENSIC REPORT DOSSIER */}
      {activeTab === "report" && (
        <div className="space-y-6">
          <ExportControls result={result} />
          <ForensicReport result={result} />
        </div>
      )}
    </div>
  );
}
