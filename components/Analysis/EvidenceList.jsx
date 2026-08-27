import React from "react";
import EvidenceCard from "./EvidenceCard";
import { ShieldCheck, SearchCheck } from "lucide-react";

/**
 * EvidenceList Component (Dark SOC Theme)
 *
 * Renders the list of detected forensic indicators or a reassuring empty state
 * when no suspicious traits are detected.
 *
 * @param {Object} props
 * @param {Array<Object>} [props.indicators=[]] - Array of detected indicator objects.
 */
export default function EvidenceList({ indicators = [] }) {
  const safeIndicators = Array.isArray(indicators) ? indicators : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
        <div className="flex items-center gap-2">
          <SearchCheck className="h-4 w-4 text-indigo-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
            Detected AI & Forensic Indicators ({safeIndicators.length})
          </h3>
        </div>
      </div>

      {safeIndicators.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h4 className="mt-3 text-sm font-semibold text-emerald-300">
            No malicious indicators detected
          </h4>
          <p className="mt-1 max-w-md text-xs text-[#71717A]">
            The email does not contain recognizable patterns of social engineering, credential harvesting, or deceptive links.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {safeIndicators.map((indicator, index) => (
            <EvidenceCard
              key={`${indicator.type || "ind"}-${index}`}
              indicator={indicator}
            />
          ))}
        </div>
      )}
    </div>
  );
}
