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
      description: "Detects Cyrillic and internationalized unicode characters masquerading as standard ASCII corporate domains.",
      status: "Active",
      severity: "critical",
    },
    {
      title: "Embedded Userinfo Credential Traps",
      description: "Identifies deceptive URLs structured with basic-auth syntax (e.g. https://legit.com@evil-domain.com).",
      status: "Active",
      severity: "critical",
    },
    {
      title: "IP-Literal Hostname Flagging",
      description: "Flags URLs directly utilizing raw IPv4/IPv6 addresses to bypass corporate domain reputation registries.",
      status: "Active",
      severity: "high",
    },
    {
      title: "Non-Standard Port Routing",
      description: "Inspects HTTP/HTTPS links operating on unusual TCP ports (e.g. :8080, :8443, :8888).",
      status: "Active",
      severity: "medium",
    },
    {
      title: "Transmission IP Hop Extraction",
      description: "Parses inbound RFC 5322 Received headers to extract public IP relay topologies and autonomous system nodes.",
      status: "Active",
      severity: "info",
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#F4F4F5]">
          Artifact Intelligence & Heuristic Scanners
        </h1>
        <p className="text-xs text-[#71717A]">
          Automated URL decomposition, IPv4/IPv6 classification & reputation engines
        </p>
      </div>

      {/* Engine Status KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#27272A] bg-[#111113] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#71717A]">
            <span className="font-semibold uppercase tracking-wider">Lookup Cap</span>
            <Database className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-[#F4F4F5]">
            10 / Category
          </p>
          <span className="text-[10px] text-[#71717A]">
            Quota-conservative parallel rate limiting
          </span>
        </div>

        <div className="rounded-xl border border-[#27272A] bg-[#111113] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#71717A]">
            <span className="font-semibold uppercase tracking-wider">Normalization</span>
            <Cpu className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-emerald-400">
            RFC 3986
          </p>
          <span className="text-[10px] text-[#71717A]">
            Deduplicated protocol & root-domain decomposition
          </span>
        </div>

        <div className="rounded-xl border border-[#27272A] bg-[#111113] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#71717A]">
            <span className="font-semibold uppercase tracking-wider">External Feeds</span>
            <Network className="h-4 w-4 text-blue-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-blue-400">
            Active / Fallback
          </p>
          <span className="text-[10px] text-[#71717A]">
            Zero-crash Promise.allSettled fault tolerance
          </span>
        </div>
      </div>

      {/* Heuristic Modules List */}
      <div className="rounded-xl border border-[#27272A] bg-[#111113] p-5 shadow-2xs">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F4F4F5] border-b border-[#27272A] pb-3">
          Local Forensic Heuristic Analyzers
        </h3>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {heuristics.map((h, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-[#27272A] bg-[#141417] p-3.5 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F4F4F5]">
                  {h.title}
                </span>
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.2 font-mono text-[9px] font-bold uppercase text-emerald-400 border border-emerald-500/20">
                  {h.status}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#A1A1AA]">
                {h.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
