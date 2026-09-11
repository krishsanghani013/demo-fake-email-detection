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
  Filter,
  ArrowUpDown,
  Clock,
} from "lucide-react";
import RiskBadge from "@/components/Analysis/RiskBadge";
import EmptyState from "@/components/ui/EmptyState";
import CopyButton from "@/components/ui/CopyButton";

/**
 * InvestigationsListView Component (SOC Case Management View)
 *
 * Provides a searchable, filterable registry of all forensic investigations:
 * - Real user case data
 * - Search by Case ID, subject, sender
 * - Filter by classification and severity
 * - Sort by newest, oldest, or highest risk
 * - Responsive desktop table + mobile card layout
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
  const [sortBy, setSortBy] = useState("newest"); // "newest" | "oldest" | "risk"

  const filteredCases = cases
    .filter((c) => {
      // Classification filter
      if (filter !== "all" && c.classification !== filter) return false;

      // Search query
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const caseId = (c.caseId || c.id || "").toLowerCase();
      const subject = (c.subject || c.metadata?.subject || "").toLowerCase();
      const sender = (c.sender || c.metadata?.from || "").toLowerCase();

      return (
        caseId.includes(query) ||
        subject.includes(query) ||
        sender.includes(query)
      );
    })
    .sort((a, b) => {
      if (sortBy === "risk") {
        return (Number(b.riskScore) || 0) - (Number(a.riskScore) || 0);
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#F8FAFC]">
            Investigations
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Review and investigate previously analyzed email telemetry and forensic archives.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewInvestigation}
          className="inline-flex h-9 items-center gap-2 self-start rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-500 active:scale-[0.98] sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Analyze New Email</span>
        </button>
      </div>

      {/* 2. Filter & Search Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[#1C2436] bg-[#111723] p-3">
        {/* Classification Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
          {[
            { id: "all", label: `All (${cases.length})` },
            {
              id: "fraudulent",
              label: `Critical / Phish (${
                cases.filter((c) => c.classification === "fraudulent").length
              })`,
            },
            {
              id: "suspicious",
              label: `Review (${
                cases.filter((c) => c.classification === "suspicious").length
              })`,
            },
            {
              id: "legitimate",
              label: `Clean (${
                cases.filter((c) => c.classification === "legitimate").length
              })`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors shrink-0 ${
                filter === tab.id
                  ? "bg-[#161D2D] text-white border border-[#253046] shadow-xs"
                  : "text-[#94A3B8] hover:text-[#F8FAFC]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2">
          {/* Sort Selector */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-8 rounded-lg border border-[#1C2436] bg-[#161D2D] px-2.5 text-xs text-[#94A3B8] focus:border-blue-500 focus:outline-hidden"
              aria-label="Sort investigations"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="risk">Highest Risk</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search case ID, sender..."
              className="h-8 w-full rounded-lg border border-[#1C2436] bg-[#161D2D] pl-8 pr-3 text-xs text-[#F8FAFC] placeholder-[#64748B] focus:border-blue-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* 3. Case Registry List / Table */}
      {filteredCases.length === 0 ? (
        <EmptyState
          icon={FolderSearch}
          title={
            cases.length === 0
              ? "No Investigations in Registry"
              : "No Matching Investigations Found"
          }
          description={
            cases.length === 0
              ? "You haven't performed any email forensic scans yet. Analyze your first email to begin building your telemetry."
              : "No cases match your active filter or search criteria. Clear search or select 'All Cases' to see results."
          }
          actionLabel={
            cases.length === 0 ? "Analyze New Email" : "Clear Filter"
          }
          onAction={
            cases.length === 0
              ? onNewInvestigation
              : () => {
                  setFilter("all");
                  setSearchQuery("");
                }
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-[#1C2436] bg-[#111723] shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1C2436] bg-[#161D2D]/60 text-[11px] font-mono uppercase text-[#64748B]">
                  <th className="py-3 px-4 font-medium">Case ID</th>
                  <th className="py-3 px-4 font-medium">Subject & Sender</th>
                  <th className="py-3 px-4 font-medium">Verdict</th>
                  <th className="py-3 px-4 font-medium text-right">Risk Score</th>
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2436]">
                {filteredCases.map((c) => {
                  const caseId = c.caseId || c.id || "UNKNOWN";
                  const subject = c.subject || c.metadata?.subject || "No Subject";
                  const sender = c.sender || c.metadata?.from || "Unknown Sender";
                  const score = Number(c.riskScore) || 0;
                  const classification = c.classification || "suspicious";
                  const riskLevel = c.riskLevel || (score >= 75 ? "critical" : score >= 40 ? "medium" : "low");
                  const dateStr = c.createdAt
                    ? new Date(c.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "N/A";

                  return (
                    <tr
                      key={caseId}
                      onClick={() => onSelectCase(c)}
                      className="group cursor-pointer hover:bg-[#161D2D]/60 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-medium text-blue-400">
                        <div className="flex items-center gap-1.5">
                          <span>{caseId}</span>
                          <CopyButton text={caseId} />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-[320px]">
                        <p className="truncate font-semibold text-[#F8FAFC] group-hover:text-blue-300 transition-colors">
                          {subject}
                        </p>
                        <p className="truncate text-[11px] text-[#64748B] font-mono">
                          {sender}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <RiskBadge
                          classification={classification}
                          riskLevel={riskLevel}
                          size="sm"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm">
                        <span
                          className={
                            score >= 75
                              ? "text-rose-400"
                              : score >= 40
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }
                        >
                          {score}
                        </span>
                        <span className="text-[10px] text-[#64748B]">/100</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#94A3B8]">
                        {dateStr}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCase(c);
                          }}
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-[#94A3B8] hover:text-white hover:bg-[#1D263B] border border-[#253046] transition-colors"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (Shown on small screens) */}
          <div className="md:hidden space-y-3">
            {filteredCases.map((c) => {
              const caseId = c.caseId || c.id || "UNKNOWN";
              const subject = c.subject || c.metadata?.subject || "No Subject";
              const sender = c.sender || c.metadata?.from || "Unknown Sender";
              const score = Number(c.riskScore) || 0;
              const classification = c.classification || "suspicious";
              const riskLevel = c.riskLevel || (score >= 75 ? "critical" : score >= 40 ? "medium" : "low");
              const dateStr = c.createdAt
                ? new Date(c.createdAt).toLocaleDateString()
                : "N/A";

              return (
                <div
                  key={caseId}
                  onClick={() => onSelectCase(c)}
                  className="rounded-xl border border-[#1C2436] bg-[#111723] p-4 space-y-3 cursor-pointer hover:border-[#253046] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-blue-400">
                      {caseId}
                    </span>
                    <span className="font-mono text-[11px] text-[#64748B]">
                      {dateStr}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-[#F8FAFC] line-clamp-1">
                      {subject}
                    </h3>
                    <p className="text-xs text-[#64748B] truncate font-mono mt-0.5">
                      {sender}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#1C2436]">
                    <RiskBadge
                      classification={classification}
                      riskLevel={riskLevel}
                      size="sm"
                    />

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-[#F8FAFC]">
                        {score} <span className="text-[10px] text-[#64748B]">/100</span>
                      </span>

                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#94A3B8] border border-[#253046]"
                      >
                        <span>View</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
