import React from "react";
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  Flame,
  Link2,
  KeyRound,
  DollarSign,
  UserX,
  Clock,
  MailWarning,
  Quote,
  ShieldCheck,
  Globe,
  GitCompare,
  Bot,
  Database,
  Terminal,
} from "lucide-react";
import RiskContribution from "./RiskContribution";

/**
 * Returns an appropriate icon based on category and type.
 */
function getEvidenceIcon(category, typeString) {
  const lowerCat = String(category || "").toLowerCase();
  const lowerType = String(typeString || "").toLowerCase();

  if (lowerCat.includes("threat") || lowerType.includes("url") || lowerType.includes("domain") || lowerType.includes("ip")) {
    if (lowerType.includes("url")) return Link2;
    return Globe;
  }
  if (lowerCat.includes("auth") || lowerType.includes("spf") || lowerType.includes("dkim") || lowerType.includes("dmarc")) {
    return ShieldCheck;
  }
  if (lowerCat.includes("ident") || lowerType.includes("mismatch") || lowerType.includes("sender")) {
    return GitCompare;
  }
  if (lowerType.includes("credential") || lowerType.includes("harvest") || lowerType.includes("password")) {
    return KeyRound;
  }
  if (lowerType.includes("financial") || lowerType.includes("wire") || lowerType.includes("invoice")) {
    return DollarSign;
  }
  if (lowerType.includes("impersonat") || lowerType.includes("brand")) {
    return UserX;
  }
  if (lowerType.includes("urgency") || lowerType.includes("time")) {
    return Clock;
  }
  return Bot;
}

/**
 * Severity styling and badges.
 */
const SEVERITY_CONFIG = {
  critical: {
    label: "CRITICAL",
    badgeClass: "border border-rose-500/30 bg-rose-500/10 text-rose-400 font-mono",
    borderClass: "border-l-4 border-l-rose-500 border-[#27272A]",
    icon: AlertOctagon,
  },
  high: {
    label: "HIGH",
    badgeClass: "border border-orange-500/30 bg-orange-500/10 text-orange-400 font-mono",
    borderClass: "border-l-4 border-l-orange-500 border-[#27272A]",
    icon: Flame,
  },
  medium: {
    label: "MEDIUM",
    badgeClass: "border border-amber-500/30 bg-amber-500/10 text-amber-400 font-mono",
    borderClass: "border-l-4 border-l-amber-500 border-[#27272A]",
    icon: AlertTriangle,
  },
  low: {
    label: "LOW",
    badgeClass: "border border-blue-500/30 bg-blue-500/10 text-blue-400 font-mono",
    borderClass: "border-l-4 border-l-blue-500 border-[#27272A]",
    icon: Info,
  },
};

/**
 * Humanizes raw machine types (e.g. "reply_to_mismatch" -> "Reply-To Mismatch").
 */
function humanizeType(typeStr) {
  if (!typeStr) return "Forensic Observation";
  if (typeStr.includes(" ") || typeStr.includes("-")) return typeStr;
  return typeStr
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Formats confidence to integer percentage (e.g. 0.95 -> 95%).
 */
function formatConfidence(conf) {
  if (typeof conf !== "number" || isNaN(conf)) return null;
  const pct = conf <= 1 ? Math.round(conf * 100) : Math.round(conf);
  return `${pct}%`;
}

/**
 * EvidenceCard Component (Dark SOC Theme)
 *
 * Renders an explainable Evidence Chain card:
 * - Stable ID (EV-001)
 * - Severity Badge ([CRITICAL], [HIGH], etc.)
 * - Risk Contribution (+X pts)
 * - Source attribution
 * - Observed Evidence snippet
 * - Extracted artifact tag
 * - Explanation
 * - Confidence metric
 *
 * @param {Object} props
 * @param {Object} [props.evidence] - Standard EvidenceItem object.
 * @param {Object} [props.indicator] - Legacy indicator object fallback.
 */
export default function EvidenceCard({ evidence: evidenceProp, indicator }) {
  const item = evidenceProp || indicator;
  if (!item) return null;

  const id = item.id || null;
  const category = item.category || "ai";
  const rawType = item.type || item.finding || "Forensic Observation";
  const title = humanizeType(rawType);
  const source = item.source || (category === "ai" ? "AI Content Analysis" : "Email Inspection");
  const explanation = item.explanation || item.description || item.finding || "";
  const observedEvidence = item.evidence || null;
  const artifact = item.artifact || null;
  const points = item.riskContribution ?? item.contribution ?? null;

  const normSev = String(item.severity || "").toLowerCase().trim();
  const config = SEVERITY_CONFIG[normSev] || SEVERITY_CONFIG.medium;
  const SeverityIcon = config.icon;
  const iconComponent = getEvidenceIcon(category, rawType);
  const formattedConf = formatConfidence(item.confidence);

  return (
    <div
      className={`group relative rounded-xl border bg-[#141417] p-4.5 shadow-2xs transition-all hover:border-[#3F3F46] hover:bg-[#18181B] ${config.borderClass}`}
    >
      {/* Top Header Row: ID, Severity, Type, Points */}
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#18181B] text-indigo-400 border border-[#27272A] group-hover:border-indigo-500/40">
            {React.createElement(iconComponent, { className: "h-4 w-4" })}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {id && (
                <span className="font-mono text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-1.5 py-0.5 rounded">
                  {id}
                </span>
              )}
              <h4 className="text-xs font-bold text-[#F4F4F5] truncate">
                {title}
              </h4>
            </div>

            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[#71717A] font-mono">
              <span>Source: <strong className="text-[#A1A1AA]">{source}</strong></span>
              {artifact && (
                <>
                  <span>•</span>
                  <span className="truncate">Artifact: <code className="text-indigo-300 font-mono">{artifact}</code></span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Severity Badge & Points */}
        <div className="flex items-center gap-2 shrink-0">
          {points !== null && points > 0 && (
            <RiskContribution points={points} severity={normSev} />
          )}

          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.badgeClass}`}
          >
            <SeverityIcon className="h-3 w-3" />
            <span>{config.label}</span>
          </span>
        </div>
      </div>

      {/* Explanation Text */}
      {explanation && (
        <p className="mt-3 text-xs leading-relaxed text-[#D4D4D8]">
          {explanation}
        </p>
      )}

      {/* Observed Evidence Quote / Block */}
      {observedEvidence && (
        <div className="mt-3 rounded-lg bg-[#0E0E11] p-2.5 border border-[#27272A] text-xs font-mono text-[#E4E4E7]">
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#27272A]/70 text-[9px] uppercase tracking-wider text-[#71717A] font-sans font-semibold">
            <div className="flex items-center gap-1 text-indigo-400">
              <Terminal className="h-2.5 w-2.5" />
              <span>Observed Forensic Evidence</span>
            </div>
            {formattedConf && (
              <span className="font-mono text-[9px] text-[#A1A1AA]">
                Confidence: {formattedConf}
              </span>
            )}
          </div>
          <pre className="mt-1.5 whitespace-pre-wrap break-all text-[11px] leading-relaxed text-[#D4D4D8] font-mono select-all">
            {observedEvidence}
          </pre>
        </div>
      )}
    </div>
  );
}
