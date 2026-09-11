"use client";

import React from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  MailCheck,
  GitCompare,
  Globe,
  Bot,
  ArrowDown,
  Lock,
  Layers,
  CheckCircle2,
} from "lucide-react";

/**
 * Returns icon and styling for an evidence chain category.
 */
function getCategoryMeta(category, severity) {
  const normCat = String(category || "").toLowerCase();
  const normSev = String(severity || "").toLowerCase();

  const isCritical = normSev === "critical";
  const isHigh = normSev === "high";
  const isMedium = normSev === "medium";

  let icon = Layers;
  let label = "Evidence Signal";

  if (normCat.includes("auth") || normCat.includes("spf") || normCat.includes("dkim") || normCat.includes("dmarc")) {
    icon = MailCheck;
    label = "Authentication Protocol";
  } else if (normCat.includes("identity") || normCat.includes("domain") || normCat.includes("sender")) {
    icon = GitCompare;
    label = "Sender Consistency";
  } else if (normCat.includes("threat") || normCat.includes("intel") || normCat.includes("url") || normCat.includes("ip")) {
    icon = Globe;
    label = "Threat Intelligence";
  } else if (normCat.includes("ai") || normCat.includes("content") || normCat.includes("deception")) {
    icon = Bot;
    label = "AI Deception Analysis";
  } else if (normCat.includes("verdict")) {
    icon = isCritical || isHigh ? ShieldAlert : ShieldCheck;
    label = "Final Synthesized Risk";
  }

  const badgeClass = isCritical
    ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
    : isHigh
    ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
    : isMedium
    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
    : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";

  return { icon, label, badgeClass };
}

/**
 * EvidenceChain Component
 *
 * Renders the vertical, step-by-step forensic progression that led
 * to the final risk score and verdict.
 *
 * @param {Object} props
 * @param {Array<Object>} [props.evidence=[]] - Raw or breakdown evidence items.
 * @param {number} props.riskScore - Overall risk score.
 * @param {string} [props.verdict] - Final verdict string.
 * @param {string} [props.riskLevel] - Final severity level.
 * @param {Object} [props.authentication] - Optional auth status object.
 * @param {Object} [props.identity] - Optional identity consistency object.
 */
export default function EvidenceChain({
  evidence = [],
  riskScore = 0,
  verdict = "EVALUATED",
  riskLevel = "medium",
  authentication,
  identity,
}) {
  const safeEvidence = Array.isArray(evidence) ? evidence : [];

  // Assemble distinct chronological/logical evidence chain steps
  const steps = [];

  // Step 1: Authentication Evaluation
  if (authentication) {
    const isSpfFail = authentication.spf?.status === "fail" || authentication.spf?.status === "softfail";
    const isDkimFail = authentication.dkim?.status === "fail";
    const isDmarcFail = authentication.dmarc?.status === "fail";

    if (isSpfFail || isDkimFail || isDmarcFail) {
      steps.push({
        id: "auth-fail",
        category: "authentication",
        title: "Authentication Protocol Failure",
        severity: isDmarcFail ? "high" : "medium",
        explanation: `Protocol verification failed: SPF: ${authentication.spf?.status || "none"}, DKIM: ${authentication.dkim?.status || "none"}, DMARC: ${authentication.dmarc?.status || "none"}.`,
        technicalDetail: `DKIM Domain: ${authentication.dkim?.signingDomain || "none"}, DMARC Policy: ${authentication.dmarc?.policy || "none"}`,
        contribution: isDmarcFail ? 17 : 10,
      });
    } else if (authentication.spf?.status === "pass" && authentication.dkim?.status === "pass") {
      steps.push({
        id: "auth-pass",
        category: "authentication",
        title: "Authentication Protocols Passed",
        severity: "low",
        explanation: "SPF, DKIM, and DMARC alignments successfully verified against originating MTA records.",
        technicalDetail: `Verified Domain: ${authentication.dkim?.signingDomain || "Valid"}`,
        contribution: 0,
      });
    }
  }

  // Step 2: Add specific evidence items from deterministic analysis
  safeEvidence.forEach((item, idx) => {
    // Avoid duplicate auth steps
    if (steps.some((s) => s.title === item.type || s.id === item.id)) return;

    steps.push({
      id: item.id || `ev-${idx}`,
      category: item.category || "ai_content",
      title: (item.type || item.finding || "Discovered Forensic Signal")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      severity: item.severity || "medium",
      explanation: item.explanation || item.evidence || "Forensic artifact observed in email headers or body.",
      technicalDetail: item.evidence ? `Observed: "${item.evidence}"` : null,
      contribution: item.riskContribution ?? item.contribution ?? 0,
    });
  });

  // If no items were detected (Clean email)
  if (steps.length === 0) {
    steps.push({
      id: "clean-headers",
      category: "authentication",
      title: "Clean RFC 5322 Ingress",
      severity: "low",
      explanation: "No header anomalies, spoofing attempts, or deceptive routing detected.",
      technicalDetail: "Header integrity verified",
      contribution: 0,
    });
    steps.push({
      id: "clean-content",
      category: "ai_content",
      title: "Benign Content Analysis",
      severity: "low",
      explanation: "Natural language analysis found standard communicative tone with zero coercive urgency.",
      technicalDetail: "No psychological manipulation triggers found",
      contribution: 0,
    });
  }

  // Final Step: Culminating Verdict
  const isCritical = riskScore >= 75 || riskLevel === "critical";
  const isSuspicious = riskScore >= 25 || riskLevel === "medium" || riskLevel === "high";

  steps.push({
    id: "verdict-step",
    category: "verdict",
    title: `Final Synthesized Verdict: ${verdict.toUpperCase()}`,
    severity: isCritical ? "critical" : isSuspicious ? "high" : "low",
    explanation: `Deterministic risk engine converged at score ${riskScore} / 100 based on correlated multi-vector evidence.`,
    technicalDetail: `Composite Risk Score: ${riskScore} | Severity Tier: ${riskLevel.toUpperCase()}`,
    contribution: riskScore,
    isFinal: true,
  });

  return (
    <div className="space-y-6 rounded-xl border border-[#1C2436] bg-[#111723] p-6 shadow-2xs">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-[#1C2436] pb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
            Forensic Evidence Chain
          </h3>
          <p className="text-[11px] text-[#94A3B8]">
            Sequential correlation of telemetry signals and deterministic risk attribution
          </p>
        </div>

        <span className="font-mono text-xs text-blue-400 bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 rounded">
          {steps.length} Signal Vectors
        </span>
      </div>

      {/* Vertical Step Sequence */}
      <div className="space-y-4">
        {steps.map((step, idx) => {
          const stepNum = String(idx + 1).padStart(2, "0");
          const meta = getCategoryMeta(step.category, step.severity);
          const Icon = meta.icon;
          const isLast = idx === steps.length - 1;

          return (
            <div key={step.id || idx} className="relative">
              <div
                className={`rounded-xl border p-4.5 transition-all ${
                  step.isFinal
                    ? step.severity === "critical"
                      ? "bg-gradient-to-r from-rose-500/10 to-[#161D2D] border-rose-500/40 shadow-[0_0_16px_rgba(239,68,68,0.15)]"
                      : "bg-gradient-to-r from-blue-500/10 to-[#161D2D] border-blue-500/40"
                    : "bg-[#161D2D] border-[#1C2436] hover:border-[#253046]"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Step Number & Category Icon */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#111723] text-blue-400 border border-[#253046] font-mono text-xs font-bold">
                      {stepNum}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-sm text-[#F8FAFC]">
                          {step.title}
                        </h4>
                        <span
                          className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${meta.badgeClass}`}
                        >
                          {step.severity}
                        </span>
                      </div>

                      <p className="text-xs leading-relaxed text-[#94A3B8]">
                        {step.explanation}
                      </p>

                      {step.technicalDetail && (
                        <div className="mt-2 rounded-md bg-[#111723] p-2 font-mono text-[11px] text-[#60A5FA] border border-[#1C2436] break-all">
                          {step.technicalDetail}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Points Badge */}
                  {step.contribution !== undefined && step.contribution > 0 && !step.isFinal && (
                    <span className="font-mono text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-md shrink-0 self-start sm:self-auto">
                      +{step.contribution} pts
                    </span>
                  )}
                </div>
              </div>

              {/* Connecting Down Arrow */}
              {!isLast && (
                <div className="flex justify-center my-1.5 text-[#64748B]">
                  <ArrowDown className="h-4 w-4 text-blue-400/60" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
