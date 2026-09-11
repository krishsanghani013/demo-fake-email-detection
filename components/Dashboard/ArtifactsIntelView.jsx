"use client";

import React from "react";
import {
  Network,
  Globe,
  Link2,
  ShieldCheck,
  ShieldAlert,
  Server,
  Terminal,
  Layers,
  Database,
  Cpu,
  Shield,
  CheckCircle2,
} from "lucide-react";

/**
 * ArtifactsIntelView Component (Artifact Threat Intelligence Overview)
 *
 * Displays threat intelligence feeds, heuristic scanners, and extraction telemetry.
 */
export default function ArtifactsIntelView() {
  const heuristics = [
    {
      title: "Punycode & Homoglyph Detector",
      description:
        "Detects Cyrillic and internationalized unicode characters masquerading as standard ASCII corporate domains.",
      status: "Active",
      severity: "critical",
    },
    {
      title: "Embedded Userinfo Credential Traps",
      description:
        "Identifies deceptive URLs structured with basic-auth syntax (e.g. https://legit.com@evil-domain.com).",
      status: "Active",
      severity: "critical",
    },
    {
      title: "IP-Literal Hostname Flagging",
      description:
        "Flags URLs directly utilizing raw IPv4/IPv6 addresses to bypass corporate domain reputation registries.",
      status: "Active",
      severity: "high",
    },
    {
      title: "Non-Standard Port Routing",
      description:
        "Inspects HTTP/HTTPS links operating on unusual TCP ports (e.g. :8080, :8443, :8888).",
      status: "Active",
      severity: "medium",
    },
    {
      title: "Transmission IP Hop Extraction",
      description:
        "Parses inbound RFC 5322 Received headers to extract public IP relay topologies and autonomous system nodes.",
      status: "Active",
      severity: "info",
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#F8FAFC]">
          Artifact Intelligence & Heuristic Scanners
        </h1>
        <p className="text-xs text-[#94A3B8]">
          Automated URL decomposition, IPv4/IPv6 classification & reputation engines
        </p>
      </div>

      {/* Engine Status KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#1C2436] bg-[#111723] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span className="font-semibold uppercase tracking-wider">Lookup Cap</span>
            <Database className="h-4 w-4 text-blue-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-[#F8FAFC]">
            10 / Category
          </p>
          <span className="text-[10px] text-[#64748B]">
            Quota-conservative parallel rate limiting
          </span>
        </div>

        <div className="rounded-xl border border-[#1C2436] bg-[#111723] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span className="font-semibold uppercase tracking-wider">Heuristic Parsers</span>
            <Cpu className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-emerald-400">
            5 Active
          </p>
          <span className="text-[10px] text-[#64748B]">
            Zero-network deterministic analyzers
          </span>
        </div>

        <div className="rounded-xl border border-[#1C2436] bg-[#111723] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span className="font-semibold uppercase tracking-wider">MTA Hop Engine</span>
            <Network className="h-4 w-4 text-purple-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-[#F8FAFC]">
            Enabled
          </p>
          <span className="text-[10px] text-[#64748B]">
            RFC 5322 Received chain backtracing
          </span>
        </div>
      </div>

      {/* Heuristic Scanner Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F8FAFC]">
          Active Threat Heuristics
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {heuristics.map((h, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[#1C2436] bg-[#111723] p-4 text-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-[#F8FAFC]">
                  {h.title}
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                    h.severity === "critical"
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/25"
                      : h.severity === "high"
                      ? "bg-orange-500/10 text-orange-400 border border-orange-500/25"
                      : h.severity === "medium"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                      : "bg-blue-500/10 text-blue-400 border border-blue-500/25"
                  }`}
                >
                  {h.severity}
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                {h.description}
              </p>
              <div className="pt-2 border-t border-[#1C2436] flex items-center justify-between text-[10px] text-[#64748B]">
                <span>Status: <strong className="text-emerald-400">{h.status}</strong></span>
                <span className="font-mono">Realtime Evaluation</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
