"use client";

import React from "react";
import { ShieldAlert, ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2 } from "lucide-react";

/**
 * RiskScore Component
 *
 * Displays a visually impressive circular threat index gauge (0-100)
 * reflecting the deterministic backend risk calculation.
 *
 * @param {Object} props
 * @param {number} props.riskScore - Risk score from 0 (safe) to 100 (critical).
 * @param {string} [props.riskLevel] - Optional explicit risk severity level.
 * @param {string} [props.classification] - Optional classification text.
 */
export default function RiskScore({ riskScore = 0, riskLevel, classification }) {
  const score = Math.max(0, Math.min(100, Math.round(Number(riskScore) || 0)));

  // Determine severity tier styling
  let config = {
    label: "Safe / Legitimate",
    color: "#10B981", // Emerald
    bgGradient: "from-emerald-500/10 to-transparent",
    borderColor: "border-emerald-500/30",
    textColor: "text-emerald-400",
    icon: CheckCircle2,
  };

  if (score >= 75) {
    config = {
      label: "Critical Threat",
      color: "#EF4444", // Crimson
      bgGradient: "from-rose-500/10 to-transparent",
      borderColor: "border-rose-500/30",
      textColor: "text-rose-400",
      icon: AlertOctagon,
    };
  } else if (score >= 50) {
    config = {
      label: "High Risk",
      color: "#F97316", // Orange
      bgGradient: "from-orange-500/10 to-transparent",
      borderColor: "border-orange-500/30",
      textColor: "text-orange-400",
      icon: ShieldAlert,
    };
  } else if (score >= 25) {
    config = {
      label: "Medium Risk / Suspicious",
      color: "#F59E0B", // Amber
      bgGradient: "from-amber-500/10 to-transparent",
      borderColor: "border-amber-500/30",
      textColor: "text-amber-400",
      icon: AlertTriangle,
    };
  }

  const displayLevel = riskLevel
    ? `${String(riskLevel).toUpperCase()} RISK`
    : config.label.toUpperCase();

  const IconComponent = config.icon;

  // SVG Gauge calculations
  // Semi-circle arc: radius = 54, circumference = PI * 54 = ~169.6
  const radius = 54;
  const strokeWidth = 9;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div
      className={`relative flex flex-col items-center justify-between rounded-2xl border bg-gradient-to-b ${config.bgGradient} bg-[#111723] p-5 shadow-sm transition-colors ${config.borderColor}`}
    >
      <div className="flex w-full items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
          Unified Risk Score
        </span>
        <div className={`flex items-center gap-1.5 text-xs font-medium ${config.textColor}`}>
          <IconComponent className="h-4 w-4" />
          <span className="font-mono">{displayLevel}</span>
        </div>
      </div>

      {/* Circular Semi-Arc Gauge */}
      <div className="relative my-2 flex flex-col items-center justify-center">
        <svg width="140" height="85" viewBox="0 0 140 85" className="overflow-visible">
          {/* Background Track Arc */}
          <path
            d="M 16 75 A 54 54 0 0 1 124 75"
            fill="none"
            stroke="#1C2436"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Value Progress Arc */}
          <path
            d="M 16 75 A 54 54 0 0 1 124 75"
            fill="none"
            stroke={config.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
          />
        </svg>

        {/* Center Numbers */}
        <div className="absolute top-8 flex flex-col items-center">
          <span className={`text-4xl font-black tracking-tight font-mono ${config.textColor}`}>
            {score}
          </span>
          <span className="text-[10px] font-mono uppercase text-[#64748B]">
            / 100 Index
          </span>
        </div>
      </div>

      {/* Severity Indicator Scale */}
      <div className="w-full space-y-1.5 pt-2 border-t border-[#1C2436]/80 text-xs">
        <div className="flex items-center justify-between font-mono text-[11px]">
          <span className="text-[#94A3B8]">0 Safe</span>
          <span className="text-[#94A3B8]">50 Suspicious</span>
          <span className="text-[#94A3B8]">100 Critical</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
          <span>Classification</span>
          <span className="font-semibold text-[#F8FAFC]">
            {classification ? classification.toUpperCase() : "EVALUATED"}
          </span>
        </div>
      </div>
    </div>
  );
}
