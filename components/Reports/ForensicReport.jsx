import React from "react";
import {
  FileText,
  ShieldAlert,
  ShieldCheck,
  Mail,
  Lock,
  GitCompare,
  Globe,
  Clock,
  CheckSquare,
  AlertTriangle,
} from "lucide-react";
import { createInvestigationSnapshot } from "@/lib/investigationSnapshot";

/**
 * ForensicReport Component (Dark SOC Printable Report)
 *
 * Renders a complete, human-readable forensic report on the web page.
 * Uses the normalized investigation snapshot as the single source of truth.
 *
 * @param {Object} props
 * @param {Object} props.result - Complete analysis result object.
 */
export default function ForensicReport({ result }) {
  if (!result) return null;

  const snapshot = createInvestigationSnapshot(result);
  if (!snapshot) return null;

  const caseId = snapshot.case?.id || "N/A";
  const analysisTime = snapshot.case?.createdAt || new Date().toISOString();
  const risk = snapshot.risk || {};
  const classification = String(risk.classification || "UNKNOWN").toUpperCase();
  const riskScore = risk.score ?? 0;
  const riskLevel = String(risk.level || "MEDIUM").toUpperCase();
  const confidence = risk.confidence ?? 0;

  const emailMeta = snapshot.email?.metadata || {};
  const auth = snapshot.authentication || {};
  const identity = snapshot.identity || {};
  const consistency = snapshot.consistency || {};
  const ti = snapshot.threatIntelligence || {};
  const breakdown = snapshot.risk?.breakdown || [];
  const ai = snapshot.aiAnalysis || {};

  return (
    <div className="space-y-6 rounded-xl border border-[#27272A] bg-[#111113] p-6 font-sans shadow-2xs">
      {/* Report Header */}
      <div className="border-b border-[#27272A] pb-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
          <FileText className="h-4 w-4" />
          <span>Email Forensics Investigation Report</span>
        </div>
        <h2 className="mt-1 text-lg font-bold text-[#F4F4F5]">
          Forensic Case Briefing Document
        </h2>
        <div className="mt-2 flex flex-wrap gap-4 font-mono text-xs text-[#71717A]">
          <span>Case ID: <strong className="text-[#F4F4F5]">{caseId}</strong></span>
          <span>•</span>
          <span>Analysis Time: {analysisTime}</span>
        </div>
      </div>

      {/* 1. Executive Summary */}
      <section className="space-y-2 rounded-xl bg-[#141417] p-4 border border-[#27272A]">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
          1. Executive Summary
        </h3>
        <div className="grid grid-cols-2 gap-3 pt-1 text-xs sm:grid-cols-4 font-mono">
          <div>
            <span className="text-[10px] text-[#71717A] uppercase font-sans">Verdict</span>
            <p className="font-bold text-[#F4F4F5] font-sans">{classification}</p>
          </div>
          <div>
            <span className="text-[10px] text-[#71717A] uppercase font-sans">Unified Risk</span>
            <p className="font-bold text-indigo-400">{riskScore} / 100</p>
          </div>
          <div>
            <span className="text-[10px] text-[#71717A] uppercase font-sans">Severity Level</span>
            <p className="font-bold uppercase text-[#F4F4F5] font-sans">{riskLevel}</p>
          </div>
          <div>
            <span className="text-[10px] text-[#71717A] uppercase font-sans">Confidence</span>
            <p className="font-bold text-emerald-400">{confidence}%</p>
          </div>
        </div>
        {ai.summary && (
          <p className="mt-2 border-t border-[#27272A] pt-2 text-xs leading-relaxed text-[#D4D4D8]">
            {ai.summary}
          </p>
        )}
      </section>

      {/* 2. Email Information */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
          2. Email Information
        </h3>
        <div className="grid grid-cols-1 gap-2 rounded-lg border border-[#27272A] bg-[#141417] p-3 text-xs sm:grid-cols-2 font-mono">
          <div><span className="text-[#71717A]">From:</span> <span className="text-[#F4F4F5]">{emailMeta.from}</span></div>
          <div><span className="text-[#71717A]">To:</span> <span className="text-[#F4F4F5]">{emailMeta.to}</span></div>
          <div><span className="text-[#71717A]">Subject:</span> <span className="text-[#F4F4F5] font-sans font-medium">{emailMeta.subject}</span></div>
          <div><span className="text-[#71717A]">Date:</span> <span className="text-[#F4F4F5]">{emailMeta.date || "Unknown"}</span></div>
          {emailMeta.replyTo && (
            <div><span className="text-[#71717A]">Reply-To:</span> <span className="text-[#F4F4F5]">{emailMeta.replyTo}</span></div>
          )}
          {emailMeta.messageId && (
            <div className="truncate text-[11px]"><span className="text-[#71717A]">Message-ID:</span> <span className="text-[#A1A1AA]">{emailMeta.messageId}</span></div>
          )}
        </div>
      </section>

      {/* 3. Authentication & Sender Consistency */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
          3. Technical Authentication & Consistency
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-[#27272A] bg-[#141417] p-3 text-xs">
            <span className="font-semibold text-[#F4F4F5]">Authentication Results:</span>
            <ul className="mt-1.5 space-y-1 font-mono text-[11px] text-[#A1A1AA]">
              <li>• SPF: {String(auth.spf?.status || "NOT AVAILABLE").toUpperCase()}</li>
              <li>• DKIM: {String(auth.dkim?.status || "NOT AVAILABLE").toUpperCase()}</li>
              <li>• DMARC: {String(auth.dmarc?.status || "NOT AVAILABLE").toUpperCase()}</li>
            </ul>
          </div>

          <div className="rounded-lg border border-[#27272A] bg-[#141417] p-3 text-xs">
            <span className="font-semibold text-[#F4F4F5]">Sender Domain Alignment:</span>
            <ul className="mt-1.5 space-y-1 text-[11px] text-[#A1A1AA]">
              <li>• From Domain: <span className="font-mono text-[#F4F4F5]">{identity.fromDomain || "N/A"}</span></li>
              <li>• Reply-To Domain: <span className="font-mono text-[#F4F4F5]">{identity.replyToDomain || "None"}</span></li>
              <li>• Status: <strong className="text-emerald-400">{consistency.status || "Consistent"}</strong></li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. Threat Intelligence & Artifacts */}
      {(ti.urls?.length > 0 || ti.ips?.length > 0) && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
            4. Threat Intelligence Findings
          </h3>
          <div className="space-y-1.5 rounded-lg border border-[#27272A] bg-[#141417] p-3 text-xs">
            {ti.urls?.map((u, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <span className="font-mono truncate text-[#F4F4F5]">{u.artifact}</span>
                <span className="font-mono font-bold uppercase text-rose-400">{u.status}</span>
              </div>
            ))}
            {ti.ips?.map((ip, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <span className="font-mono truncate text-[#F4F4F5]">{ip.artifact}</span>
                <span className="font-mono font-bold uppercase text-rose-400">{ip.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Explainable Risk Breakdown */}
      {breakdown.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
            5. Explainable Risk Breakdown
          </h3>
          <div className="space-y-1.5 rounded-lg border border-[#27272A] bg-[#141417] p-3 text-xs">
            {breakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <span className="text-[#D4D4D8]">{item.finding}</span>
                <span className="font-mono font-bold text-rose-400">+{item.contribution} pts</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Actionable Recommendation */}
      <section className="space-y-1.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-xs">
        <h3 className="font-semibold uppercase tracking-wider text-indigo-400">
          6. Actionable Recommendation
        </h3>
        <p className="leading-relaxed text-[#D4D4D8]">
          {ai.recommendation || "Do not interact with unverified links or attachments from untrusted senders."}
        </p>
      </section>

      {/* Footer Disclaimer */}
      <div className="border-t border-[#27272A] pt-3 text-[10px] text-[#71717A]">
        Report deterministically generated by AI Email Forensics Engine. All evidence derived from static RFC 5322 header and body inspection.
      </div>
    </div>
  );
}
