import React from "react";
import { Network, CheckCircle2, AlertTriangle, HelpCircle, XCircle } from "lucide-react";

/**
 * Returns badge styling for IP threat intelligence status.
 */
function getIpBadgeConfig(status) {
  const norm = String(status || "").toLowerCase().trim();

  switch (norm) {
    case "malicious":
      return {
        label: "MALICIOUS",
        badgeClass: "border border-rose-500/30 bg-rose-500/10 text-rose-400",
        icon: XCircle,
      };
    case "suspicious":
      return {
        label: "SUSPICIOUS",
        badgeClass: "border border-amber-500/30 bg-amber-500/10 text-amber-400",
        icon: AlertTriangle,
      };
    case "clean":
      return {
        label: "CLEAN",
        badgeClass: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        icon: CheckCircle2,
      };
    case "rate_limited":
      return {
        label: "RATE LIMITED",
        badgeClass: "border border-amber-500/30 bg-amber-500/10 text-amber-400",
        icon: AlertTriangle,
      };
    case "unavailable":
    default:
      return {
        label: "UNAVAILABLE",
        badgeClass: "border border-[#27272A] bg-[#18181B] text-[#71717A]",
        icon: HelpCircle,
      };
  }
}

/**
 * IpIntelCard Component (Dark SOC Theme)
 */
export default function IpIntelCard({ ipIntel, artifact }) {
  if (!ipIntel) return null;

  const badge = getIpBadgeConfig(ipIntel.status);
  const BadgeIcon = badge.icon;

  return (
    <div className="rounded-lg border border-[#27272A] bg-[#141417] p-3.5 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="h-3.5 w-3.5 text-purple-400" />
          <span className="font-mono text-xs font-bold text-[#F4F4F5]">
            {ipIntel.artifact}
          </span>
        </div>

        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold font-mono uppercase ${badge.badgeClass}`}
        >
          <BadgeIcon className="h-3 w-3" />
          <span>{badge.label}</span>
        </span>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[10px] text-[#71717A] font-mono">
        <span className="rounded bg-[#18181B] px-1.5 py-0.5 border border-[#27272A] text-[#D4D4D8]">
          {artifact?.version || (ipIntel.artifact.includes(":") ? "IPv6" : "IPv4")}
        </span>
        <span className="rounded bg-[#18181B] px-1.5 py-0.5 border border-[#27272A] capitalize text-[#D4D4D8]">
          {artifact?.type || (ipIntel.details?.isPrivate ? "Private" : "Public")}
        </span>
        {artifact?.hopIndex && (
          <span className="font-semibold text-purple-400">
            Hop #{artifact.hopIndex}
          </span>
        )}
      </div>

      {ipIntel.details?.message && (
        <p className="mt-2 text-[11px] leading-relaxed text-[#A1A1AA]">
          {ipIntel.details.message}
        </p>
      )}

      {ipIntel.details?.isp && (
        <p className="mt-1 text-[10px] text-[#71717A] font-mono">
          ISP / ASN: {ipIntel.details.isp}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between text-[10px] text-[#71717A] font-mono">
        <span>Provider: {ipIntel.source || "IP Intelligence Engine"}</span>
        {ipIntel.details?.abuseScore !== undefined && (
          <span>Abuse Confidence: {ipIntel.details.abuseScore}%</span>
        )}
      </div>
    </div>
  );
}
