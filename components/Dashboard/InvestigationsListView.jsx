"use client";

import React, { useState } from "react";
import {
  FolderSearch,
  Search,
  Plus,
  ChevronRight,
  ShieldAlert,
  Calendar,
  User,
  Mail,
  Fingerprint,
} from "lucide-react";

/**
 * InvestigationsListView Component (SOC Case Management View)
 *
 * Provides a searchable, filterable registry of all forensic investigations.
 *
 * @param {Object} props
 * @param {Array<Object>} props.cases - Stored historical investigations.
 * @param {Function} props.onSelectCase - Callback when clicking a case to open it.
 * @param {Function} props.onNewInvestigation - Callback to start a new scan.
 */
export default function InvestigationsListView({
  cases = [],
  onSelectCase,
  onNewInvestigation,
}) {
  const [filter, setFilter] = useState("all"); // "all" | "fraudulent" | "suspicious" | "legitimate"
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCases = cases.filter((c) => {
    // Classification filter
    if (filter !== "all" && c.classification !== filter) return false;

    // Search query
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const caseId = (c.caseId || "").toLowerCase();
    const subject = (c.subject || "").toLowerCase();
    const sender = (c.sender || "").toLowerCase();

    return caseId.includes(query) || subject.includes(query) || sender.includes(query);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#F4F4F5]">
            Investigation Registry
          </h1>
          <p className="text-xs text-[#71717A]">
            Case records, forensic evidence snapshots, and classification archives
          </p>
        </div>

        <button
          type="button"
          onClick={onNewInvestigation}
          className="inline-flex h-9 items-center gap-1.5 self-start rounded-lg bg-indigo-600 px-3.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-indigo-500 active:scale-[0.98] sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Investigation</span>
        </button>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[#27272A] bg-[#111113] p-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { id: "all", label: "All Cases" },
            { id: "fraudulent", label: "Malicious" },
            { id: "suspicious", label: "Review" },
            { id: "legitimate", label: "Benign" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors shrink-0 ${
                filter === tab.id
                  ? "bg-[#18181B] text-white border border-[#27272A]"
                  : "text-[#71717A] hover:text-[#F4F4F5]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#71717A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by case ID, sender, or subject..."
            className="h-8 w-full rounded-lg border border-[#27272A] bg-[#18181B] pl-9 pr-3 text-xs text-[#F4F4F5] placeholder-[#71717A] focus:border-indigo-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* 3. Investigations Table */}
      <div className="rounded-xl border border-[#27272A] bg-[#111113] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#27272A] bg-[#141417] text-[10px] uppercase font-semibold text-[#71717A] tracking-wider">
              <tr>
                <th className="px-4 py-3">Case ID</th>
                <th className="px-4 py-3">Subject / Sender</th>
                <th className="px-4 py-3">Classification</th>
                <th className="px-4 py-3 text-right">Risk Score</th>
                <th className="px-4 py-3">Analyzed</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#27272A]/70 text-[#A1A1AA]">
              {filteredCases.length > 0 ? (
                filteredCases.map((item) => {
                  const isMalicious = item.classification === "fraudulent";
                  const isSuspicious = item.classification === "suspicious";

                  return (
                    <tr
                      key={item.caseId}
                      onClick={() => onSelectCase && item.fullResult && onSelectCase(item.fullResult)}
                      className="hover:bg-[#18181B]/70 transition-colors cursor-pointer group"
                    >
                      {/* Case ID */}
                      <td className="px-4 py-3.5 font-mono font-semibold text-[#F4F4F5] group-hover:text-indigo-400">
                        <div className="flex items-center gap-1.5">
                          <Fingerprint className="h-3.5 w-3.5 text-[#71717A]" />
                          <span>{item.caseId}</span>
                        </div>
                      </td>

                      {/* Subject & Sender */}
                      <td className="px-4 py-3.5 max-w-xs sm:max-w-sm truncate">
                        <p className="font-medium text-[#F4F4F5] truncate">
                          {item.subject}
                        </p>
                        <p className="text-[11px] text-[#71717A] font-mono truncate mt-0.5">
                          {item.sender}
                        </p>
                      </td>

                      {/* Classification Badge */}
                      <td className="px-4 py-3.5">
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
                              isMalicious
                                ? "bg-rose-500"
                                : isSuspicious
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                          />
                          <span>{isMalicious ? "MALICIOUS" : isSuspicious ? "REVIEW" : "BENIGN"}</span>
                        </span>
                      </td>

                      {/* Risk Score */}
                      <td className="px-4 py-3.5 text-right font-mono">
                        <span className="font-bold text-[#F4F4F5] text-xs">
                          {item.riskScore}
                        </span>
                        <span className="text-[#71717A]"> / 100</span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-[11px] text-[#71717A] whitespace-nowrap">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recent"}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-right">
                        <span className="inline-flex items-center text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                          <span>Inspect</span>
                          <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[#71717A]">
                    No investigation records found matching your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
