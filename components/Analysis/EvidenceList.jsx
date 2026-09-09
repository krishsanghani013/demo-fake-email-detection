import React, { useState } from "react";
import EvidenceCard from "./EvidenceCard";
import { ShieldCheck, SearchCheck } from "lucide-react";
import { normalizeCategoryKey } from "./EvidenceCategory";

/**
 * Filter categories for the evidence item list.
 */
const CATEGORY_TABS = [
  { id: "all", label: "All" },
  { id: "threatIntelligence", label: "Threat Intel" },
  { id: "ai", label: "AI Content" },
  { id: "authentication", label: "Authentication" },
  { id: "identity", label: "Sender Identity" },
];

/**
 * EvidenceList Component (Dark SOC Theme)
 *
 * Renders the list of detected forensic evidence items or indicators with
 * category filtering and reassuring empty state when zero threats are found.
 *
 * @param {Object} props
 * @param {Array<Object>} [props.evidence] - Full Evidence Chain items array.
 * @param {Array<Object>} [props.indicators] - Legacy AI indicators array fallback.
 */
export default function EvidenceList({ evidence, indicators = [] }) {
  const [activeTab, setActiveTab] = useState("all");

  const items = Array.isArray(evidence) && evidence.length > 0 ? evidence : (Array.isArray(indicators) ? indicators : []);

  const filteredItems = items.filter((item) => {
    if (activeTab === "all") return true;
    return normalizeCategoryKey(item.category) === activeTab;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#27272A] pb-3">
        <div className="flex items-center gap-2">
          <SearchCheck className="h-4 w-4 text-indigo-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
            Forensic Evidence Findings ({items.length})
          </h3>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto rounded-lg bg-[#18181B] p-1 border border-[#27272A]">
            {CATEGORY_TABS.map((tab) => {
              const count =
                tab.id === "all"
                  ? items.length
                  : items.filter((i) => normalizeCategoryKey(i.category) === tab.id).length;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-[#27272A] text-white shadow-xs"
                      : "text-[#71717A] hover:text-[#F4F4F5]"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="font-mono text-[9px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {filteredItems.length === 0 && items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h4 className="mt-3 text-sm font-semibold text-emerald-300">
            No malicious evidence detected
          </h4>
          <p className="mt-1 max-w-md text-xs text-[#71717A]">
            The email does not contain recognizable patterns of social engineering, credential harvesting, domain mismatches, or malicious artifacts.
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#27272A] bg-[#141417] p-6 text-center text-xs text-[#71717A]">
          No findings in the &ldquo;{activeTab}&rdquo; category.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredItems.map((item, index) => (
            <EvidenceCard
              key={item.id || `${item.type || "item"}-${index}`}
              evidence={item}
            />
          ))}
        </div>
      )}
    </div>
  );
}
