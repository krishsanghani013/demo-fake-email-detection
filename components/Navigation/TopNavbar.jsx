"use client";

import React from "react";
import { Plus, Menu, Zap, Search, Shield } from "lucide-react";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { useQuota } from "@/lib/quota";
import UserSync from "./UserSync";

/**
 * TopNavbar Component (Modern Dark SOC Top Bar)
 *
 * Displays global risk state counters, search ingress, AI quota indicators,
 * mobile toggle, and Clerk authentication controls.
 *
 * @param {Object} props
 * @param {Function} props.onOpenMobile - Opens mobile sidebar.
 * @param {Function} props.onNewInvestigation - Triggers new investigation view.
 * @param {Object} [props.summaryStats] - Real counts of malicious, review, and benign cases.
 * @param {string} [props.searchQuery] - Current search query.
 * @param {Function} [props.onSearchChange] - Search input change handler.
 */
export default function TopNavbar({
  onOpenMobile,
  onNewInvestigation,
  summaryStats = { malicious: 0, review: 0, benign: 0 },
  searchQuery = "",
  onSearchChange,
}) {
  const quota = useQuota();

  const maliciousCount = Number(summaryStats?.malicious) || 0;
  const reviewCount = Number(summaryStats?.review) || 0;
  const benignCount = Number(summaryStats?.benign) || 0;

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full shrink-0 items-center justify-between border-b border-[#1C2436] bg-[#0A0D14]/90 backdrop-blur-md px-4 sm:px-6">
      {/* Left: Mobile Menu Trigger & Status Indicator Pills */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-[#1C2436] bg-[#111723] text-[#94A3B8] hover:text-[#F8FAFC]"
          aria-label="Open Navigation Drawer"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Global Case Classification Telemetry Pills */}
        <div className="flex items-center gap-2 text-[11px] font-medium font-mono">
          {/* Malicious / Critical */}
          <div
            className="flex items-center gap-1.5 rounded-md border border-rose-500/25 bg-rose-500/10 px-2 py-0.5 text-rose-400"
            title="Total Critical / Phishing threats detected"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            <span className="font-bold">{maliciousCount}</span>
            <span className="hidden sm:inline font-sans text-[11px]">Critical</span>
          </div>

          {/* Review / Suspicious */}
          <div
            className="flex items-center gap-1.5 rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-amber-400"
            title="Total Suspicious investigations requiring review"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            <span className="font-bold">{reviewCount}</span>
            <span className="hidden sm:inline font-sans text-[11px]">Review</span>
          </div>

          {/* Benign / Legitimate */}
          <div
            className="flex items-center gap-1.5 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-emerald-400"
            title="Total Verified Clean emails"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            <span className="font-bold">{benignCount}</span>
            <span className="hidden sm:inline font-sans text-[11px]">Clean</span>
          </div>
        </div>
      </div>

      {/* Center: Global Search Input (Desktop) */}
      {onSearchChange && (
        <div className="hidden md:flex items-center max-w-xs w-full mx-4">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search cases, subjects, senders..."
              className="h-8 w-full rounded-lg border border-[#1C2436] bg-[#111723] pl-8 pr-3 text-xs text-[#F8FAFC] placeholder-[#64748B] focus:border-blue-500 focus:outline-hidden transition-colors"
            />
          </div>
        </div>
      )}

      {/* Right: AI Quota, Primary New Investigation Button & Clerk Auth */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quota Tag */}
        <div
          className="hidden lg:flex items-center gap-1.5 rounded-md border border-[#1C2436] bg-[#111723] px-2.5 py-1 text-xs font-mono text-[#94A3B8]"
          title={`12-hour AI analysis limit: ${quota.used}/${quota.limit} used. Resets in ${quota.formattedTimeRemaining}`}
        >
          <Zap
            className={`h-3 w-3 ${
              quota.isExhausted
                ? "text-rose-400 fill-rose-400"
                : quota.percentage >= 80
                ? "text-amber-400 fill-amber-400"
                : "text-blue-400 fill-blue-400"
            }`}
          />
          <span className={quota.isExhausted ? "text-rose-400 font-semibold" : ""}>
            {quota.used}/{quota.limit} AI
          </span>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={onNewInvestigation}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-500 active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New Investigation</span>
          <span className="sm:hidden">Scan</span>
        </button>

        {/* Clerk Auth Controls */}
        <div className="flex items-center gap-2 border-l border-[#1C2436] pl-2 sm:pl-3">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className="inline-flex h-8 items-center justify-center rounded-lg border border-[#1C2436] bg-[#111723] px-2.5 sm:px-3 text-xs font-medium text-[#F8FAFC] hover:bg-[#1B2337] hover:text-white transition-colors"
              >
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                type="button"
                className="inline-flex h-8 items-center justify-center rounded-lg bg-blue-600 px-2.5 sm:px-3 text-xs font-medium text-white hover:bg-blue-500 transition-colors shadow-xs"
              >
                Sign Up
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8 rounded-lg border border-[#253046]",
                },
              }}
            />
            <UserSync />
          </Show>
        </div>
      </div>
    </header>
  );
}
