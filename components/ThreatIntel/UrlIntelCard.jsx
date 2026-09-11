import React from "react";
import { Link2, AlertTriangle, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import CopyButton from "@/components/ui/CopyButton";

/**
 * Returns badge styling for threat intelligence status.
 */
function getBadgeConfig(status) {
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
 * UrlIntelCard Component (Dark SOC Theme)
 */
export default function UrlIntelCard({ urlIntel, artifact }) {
  if (!urlIntel) return null;

  const badge = getBadgeConfig(urlIntel.status);
  const BadgeIcon = badge.icon;
  const observations = artifact?.localObservations || [];

  return (
    <div className="rounded-lg border border-[#27272A] bg-[#141417] p-3.5 text-xs">
      {/* Top row: URL and Status Badge */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />
          <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
            <p className="font-mono text-[11px] font-semibold text-[#F8FAFC] break-all select-all">
              {urlIntel.artifact}
            </p>
            <CopyButton text={urlIntel.artifact} />
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1 shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold font-mono uppercase ${badge.badgeClass}`}
        >
          <BadgeIcon className="h-3 w-3" />
          <span>{badge.label}</span>
        </span>
      </div>

      {/* Artifact Details: Hostname, Root Domain, Port */}
      {artifact && (
        <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-4 font-mono">
          <div className="rounded bg-[#18181B] p-1.5 border border-[#27272A]">
            <span className="font-semibold text-[#71717A]">Hostname:</span>
            <p className="truncate text-[#D4D4D8]">{artifact.hostname || "N/A"}</p>
          </div>
          <div className="rounded bg-[#18181B] p-1.5 border border-[#27272A]">
            <span className="font-semibold text-[#71717A]">Root Domain:</span>
            <p className="truncate text-[#D4D4D8]">{artifact.rootDomain || "N/A"}</p>
          </div>
          <div className="rounded bg-[#18181B] p-1.5 border border-[#27272A]">
            <span className="font-semibold text-[#71717A]">Protocol:</span>
            <p className="truncate uppercase text-[#D4D4D8]">{artifact.protocol?.replace(":", "") || "HTTPS"}</p>
          </div>
          <div className="rounded bg-[#18181B] p-1.5 border border-[#27272A]">
            <span className="font-semibold text-[#71717A]">Port:</span>
            <p className="truncate text-[#D4D4D8]">{artifact.port || "Default"}</p>
          </div>
        </div>
      )}

      {/* Local Suspicion Observations */}
      {observations.length > 0 && (
        <div className="mt-2.5 space-y-1 border-t border-[#27272A] pt-2">
          {observations.map((obs, idx) => (
            <div
              key={idx}
              className="flex items-start gap-1.5 text-[11px] text-amber-300"
            >
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
              <span>
                <strong className="text-amber-400">{obs.type}:</strong> {obs.description}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Source Info */}
      <div className="mt-2 flex items-center justify-between text-[10px] text-[#71717A] font-mono">
        <span>Provider: {urlIntel.source || "Threat Intelligence Feed"}</span>
        {urlIntel.checkedAt && (
          <span>Checked: {new Date(urlIntel.checkedAt).toLocaleTimeString()}</span>
        )}
      </div>
    </div>
  );
}
