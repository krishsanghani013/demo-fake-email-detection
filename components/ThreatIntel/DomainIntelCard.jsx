import React from "react";
import { Globe, AlertTriangle } from "lucide-react";
import CopyButton from "@/components/ui/CopyButton";

/**
 * DomainIntelCard Component (Dark SOC Theme)
 */
export default function DomainIntelCard({ domainIntel }) {
  if (!domainIntel) return null;

  const isSuspicious = domainIntel.status === "suspicious" || domainIntel.status === "malicious";

  return (
    <div className="flex flex-col justify-between rounded-lg border border-[#1C2436] bg-[#111723] p-3 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Globe className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <span className="font-mono font-semibold text-[#F8FAFC] truncate">
            {domainIntel.artifact}
          </span>
          <CopyButton text={domainIntel.artifact} />
        </div>

        <span
          className={`rounded-md px-2 py-0.5 text-[9px] font-bold font-mono uppercase ${
            isSuspicious
              ? "border border-amber-500/30 bg-amber-500/10 text-amber-400"
              : "border border-[#27272A] bg-[#18181B] text-[#71717A]"
          }`}
        >
          {domainIntel.status.toUpperCase()}
        </span>
      </div>

      {domainIntel.details?.subdomain && (
        <p className="mt-2 text-[10px] text-[#71717A] font-mono">
          Subdomain: <span className="text-[#D4D4D8]">{domainIntel.details.subdomain}</span>
        </p>
      )}

      {domainIntel.categories?.length > 0 && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-300">
          <AlertTriangle className="h-3 w-3 shrink-0 text-amber-400" />
          <span>{domainIntel.categories.join(", ")}</span>
        </div>
      )}
    </div>
  );
}
