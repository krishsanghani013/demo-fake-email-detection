"use client";

import React from "react";
import {
  LayoutDashboard,
  ScanSearch,
  FolderSearch,
  Network,
  FileText,
  Sparkles,
  Settings,
  HelpCircle,
  Shield,
  Radio,
  X,
  Plus,
} from "lucide-react";
import { useQuota } from "@/lib/quota";
import { SignInButton, Show, UserButton, useUser } from "@clerk/nextjs";

/**
 * Sidebar Component (Modern Dark Cybersecurity Console)
 *
 * Provides primary platform navigation, brand identity, investigation counter badges,
 * and live system operational status.
 *
 * @param {Object} props
 * @param {string} props.activeTab - Currently active view ("dashboard" | "new" | "investigations" | "threat-intel" | "reports" | "settings")
 * @param {Function} props.onSelectTab - Callback to switch views.
 * @param {number} [props.investigationCount=0] - Number of saved cases.
 * @param {boolean} [props.isMobileOpen=false] - Mobile sidebar open state.
 * @param {Function} [props.onCloseMobile] - Close mobile sidebar callback.
 */
export default function Sidebar({
  activeTab,
  onSelectTab,
  investigationCount = 0,
  isMobileOpen = false,
  onCloseMobile,
}) {
  const quota = useQuota();
  const { user } = useUser();

  const displayName =
    user?.fullName ||
    user?.firstName ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Security Analyst";

  const displayEmail =
    user?.primaryEmailAddress?.emailAddress || "Authenticated Session";

  const mainNavItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "new", label: "Analyze Email", icon: ScanSearch, highlight: true },
    {
      id: "investigations",
      label: "Investigations",
      icon: FolderSearch,
      badge: investigationCount,
    },
    { id: "threat-intel", label: "Threat Intelligence", icon: Network },
    { id: "reports", label: "Forensic Reports", icon: FileText },
  ];

  const secondaryNavItems = [
    { id: "settings", label: "Settings & Engines", icon: Settings },
    { id: "help", label: "SOC Methodology", icon: HelpCircle },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#0D111A] border-r border-[#1C2436] p-4 text-[#F8FAFC]">
      {/* Brand Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/25 shadow-[0_0_16px_rgba(59,130,246,0.2)]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-[#F8FAFC] block leading-tight">
                PhishOps Core
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#64748B] block">
                Email Forensics SOC
              </span>
            </div>
          </div>

          {/* Mobile Close Button */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close menu"
              className="lg:hidden p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#161D2D] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Quick New Scan Button */}
        <button
          type="button"
          onClick={() => {
            onSelectTab("new");
            if (onCloseMobile) onCloseMobile();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-500 active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Investigation</span>
        </button>

        {/* Primary Views Navigation */}
        <div className="space-y-1">
          <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
            Investigation Workspace
          </p>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/25 shadow-xs"
                    : item.highlight
                    ? "text-[#F8FAFC] bg-[#141A29] hover:bg-[#1B2337] border border-[#1C2436]"
                    : "text-[#94A3B8] hover:bg-[#141A29] hover:text-[#F8FAFC]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive
                        ? "text-blue-400"
                        : item.highlight
                        ? "text-blue-400"
                        : "text-[#64748B] group-hover:text-[#F8FAFC]"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1C2436] px-1.5 text-[10px] font-mono text-[#94A3B8]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Platform Settings & Help */}
        <div className="space-y-1 pt-4 border-t border-[#1C2436]">
          <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
            Platform Ops
          </p>
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#1B2337] text-white border border-[#253046]"
                    : "text-[#94A3B8] hover:bg-[#141A29] hover:text-[#F8FAFC]"
                }`}
              >
                <Icon
                  className={`h-4 w-4 transition-colors ${
                    isActive
                      ? "text-blue-400"
                      : "text-[#64748B] group-hover:text-[#F8FAFC]"
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Profile & Status Card */}
      <div className="space-y-3 pt-4 border-t border-[#1C2436]">
        {/* AI Usage Quota Mini Card */}
        <div className="rounded-lg border border-[#1C2436] bg-[#111723] p-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-[#94A3B8]">
              <Sparkles className="h-3 w-3 text-blue-400" />
              <span>AI Quota</span>
            </span>
            <span className="font-mono text-[10px] text-[#F8FAFC]">
              {quota.used} / {quota.limit}
            </span>
          </div>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[#1C2436]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                quota.isExhausted
                  ? "bg-rose-500"
                  : quota.percentage >= 80
                  ? "bg-amber-500"
                  : "bg-blue-500"
              }`}
              style={{ width: `${quota.percentage}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[9px] text-[#64748B]">
            <span>12h Window</span>
            <span>Resets in {quota.formattedTimeRemaining}</span>
          </div>
        </div>

        {/* Analyst Profile & Clerk Auth */}
        <Show when="signed-out">
          <div className="flex items-center justify-between rounded-lg bg-[#111723] p-2.5 border border-[#1C2436]">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-semibold text-[#F8FAFC] truncate">Guest Session</p>
              <p className="text-[10px] text-[#64748B] truncate">Sign in for full access</p>
            </div>
            <SignInButton mode="modal">
              <button
                type="button"
                className="inline-flex h-7 shrink-0 items-center justify-center rounded-md bg-blue-600 px-2.5 text-[11px] font-semibold text-white hover:bg-blue-500 transition-colors"
              >
                Sign In
              </button>
            </SignInButton>
          </div>
        </Show>
        <Show when="signed-in">
          <div className="flex items-center justify-between rounded-lg bg-[#111723] p-2.5 border border-[#1C2436]">
            <div className="flex items-center gap-2.5 min-w-0">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-7 w-7 rounded-md border border-[#253046]",
                  },
                }}
              />
              <div className="min-w-0 truncate">
                <p className="text-xs font-semibold text-[#F8FAFC] truncate">
                  {displayName}
                </p>
                <p className="text-[10px] text-[#64748B] truncate font-mono">
                  {displayEmail}
                </p>
              </div>
            </div>

            <div className="flex items-center" title="SOC Telemetry Active">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer Panel */}
          <aside className="relative flex h-full w-72 flex-col">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
