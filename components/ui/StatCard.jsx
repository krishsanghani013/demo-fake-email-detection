"use client";

import React from "react";

/**
 * StatCard Component
 *
 * Renders a high-density, cybersecurity SOC KPI card.
 *
 * @param {Object} props
 * @param {string} props.title - Card header label.
 * @param {string|number} props.value - Primary metric.
 * @param {string} [props.subtitle] - Contextual subtitle.
 * @param {React.ComponentType} props.icon - Lucide icon component.
 * @param {"default"|"critical"|"warning"|"success"|"info"} [props.variant="default"] - Color theme.
 * @param {string} [props.badge] - Optional badge in top right.
 */
export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  badge,
}) {
  const variantStyles = {
    default: {
      iconBg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      badgeColor: "text-blue-400/80",
    },
    critical: {
      iconBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      badgeColor: "text-rose-400/80",
    },
    warning: {
      iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      badgeColor: "text-amber-400/80",
    },
    success: {
      iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      badgeColor: "text-emerald-400/80",
    },
    info: {
      iconBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      badgeColor: "text-cyan-400/80",
    },
  }[variant] || {
    iconBg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    badgeColor: "text-blue-400/80",
  };

  return (
    <div className="rounded-xl border border-[#1C2436] bg-[#111723] p-5 shadow-2xs hover:border-[#28354F] transition-all">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg border ${variantStyles.iconBg}`}
        >
          {Icon && <Icon className="h-4 w-4" />}
        </div>
        {badge && (
          <span
            className={`text-[10px] font-mono uppercase tracking-wider ${variantStyles.badgeColor}`}
          >
            {badge}
          </span>
        )}
      </div>

      <div className="mt-4">
        <span className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight font-mono">
          {value}
        </span>
        <p className="mt-1 text-xs font-medium text-[#94A3B8]">
          {title}
        </p>
        {subtitle && (
          <p className="mt-0.5 text-[11px] text-[#64748B]">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
