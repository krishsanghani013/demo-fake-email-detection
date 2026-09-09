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
  Zap,
  Shield,
  Radio,
  X,
} from "lucide-react";
import { useQuota } from "@/lib/quota";

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

  const mainNavItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "new", label: "New Investigation", icon: ScanSearch, highlight: true },
    { id: "investigations", label: "Investigations", icon: FolderSearch, badge: investigationCount },
    { id: "threat-intel", label: "Artifact Intel", icon: Network },
    { id: "reports", label: "Forensic Reports", icon: FileText },
  ];

  const secondaryNavItems = [
    { id: "settings", label: "Platform Settings", icon: Settings },
    { id: "help", label: "Methodology & Docs", icon: HelpCircle },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#0D0D10] border-r border-[#27272A] p-4 text-[#F4F4F5]">
      {/* Brand Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.25)]">
              <Zap className="h-4 w-4 fill-indigo-400" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-[#F4F4F5] block leading-tight">
                PhishOps Core
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] block">
                SOC Forensics
              </span>
            </div>
          </div>

          {/* Mobile Close Button */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1 rounded-md text-[#71717A] hover:text-[#F4F4F5]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Primary Views Navigation */}
        <div className="space-y-1">
          <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#71717A]">
            Investigation Engine
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
                className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-xs"
                    : item.highlight
                    ? "text-[#F4F4F5] bg-[#141417] hover:bg-[#18181B] border border-[#27272A]"
                    : "text-[#A1A1AA] hover:bg-[#141417] hover:text-[#F4F4F5]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive
                        ? "text-indigo-400"
                        : item.highlight
                        ? "text-indigo-400"
                        : "text-[#71717A] group-hover:text-[#F4F4F5]"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#27272A] px-1.5 text-[10px] font-mono text-[#A1A1AA]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Platform Settings & Help */}
        <div className="space-y-1 pt-4 border-t border-[#27272A]">
          <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#71717A]">
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
                    ? "bg-[#18181B] text-white border border-[#27272A]"
                    : "text-[#A1A1AA] hover:bg-[#141417] hover:text-[#F4F4F5]"
                }`}
              >
                <Icon
                  className={`h-4 w-4 transition-colors ${
                    isActive
                      ? "text-indigo-400"
                      : "text-[#71717A] group-hover:text-[#F4F4F5]"
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Profile & Status Card */}
      <div className="space-y-3 pt-4 border-t border-[#27272A]">
        {/* AI Usage Quota Mini Card */}
        <div className="rounded-lg border border-[#27272A] bg-[#141417] p-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-[#A1A1AA]">
              <Sparkles className="h-3 w-3 text-indigo-400" />
              <span>AI Quota</span>
            </span>
            <span className="font-mono text-[10px] text-[#F4F4F5]">
              {quota.used} / {quota.limit}
            </span>
          </div>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[#27272A]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                quota.isExhausted
                  ? "bg-rose-500"
                  : quota.percentage >= 80
                  ? "bg-amber-500"
                  : "bg-indigo-500"
              }`}
              style={{ width: `${quota.percentage}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[9px] text-[#71717A]">
            <span>12h Window</span>
            <span>Resets in {quota.formattedTimeRemaining}</span>
          </div>
        </div>

        {/* Analyst Profile */}
        <div className="flex items-center justify-between rounded-lg bg-[#141417] p-2.5 border border-[#27272A]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#27272A] text-indigo-400 border border-[#3F3F46]">
              <Shield className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 truncate">
              <p className="text-xs font-semibold text-[#F4F4F5] truncate">
                SOC Tier-2 Analyst
              </p>
              <p className="text-[10px] text-[#71717A] truncate">
                secops.internal
              </p>
            </div>
          </div>

          <div className="flex items-center" title="Live heuristics active">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (250px) */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
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
