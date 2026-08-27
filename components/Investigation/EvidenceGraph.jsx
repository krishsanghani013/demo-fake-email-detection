import React from "react";
import {
  Share2,
  Mail,
  User,
  UserCheck,
  Link2,
  Globe,
  Network,
  MailCheck,
  Bot,
  ShieldAlert,
  Layers,
  ArrowRight,
} from "lucide-react";
import { generateEvidenceGraph } from "@/lib/evidenceGraph";

/**
 * Returns icon and styling for node type.
 */
function getNodeConfig(type, severity) {
  const isCritical = severity === "critical";
  const isHigh = severity === "high";

  switch (type) {
    case "email":
      return {
        icon: Mail,
        bg: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
      };
    case "sender":
    case "recipient":
      return {
        icon: User,
        bg: "bg-[#18181B] text-[#D4D4D8] border-[#27272A]",
      };
    case "url":
      return {
        icon: Link2,
        bg: isHigh || isCritical
          ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
          : "bg-[#18181B] text-[#D4D4D8] border-[#27272A]",
      };
    case "domain":
      return {
        icon: Globe,
        bg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
      };
    case "threat-intelligence":
      return {
        icon: Globe,
        bg: isCritical || isHigh
          ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
          : "bg-purple-500/20 text-purple-300 border-purple-500/30",
      };
    case "ip":
      return {
        icon: Network,
        bg: "bg-purple-500/10 text-purple-300 border-purple-500/30",
      };
    case "spf":
    case "dkim":
    case "dmarc":
      return {
        icon: MailCheck,
        bg: isCritical || isHigh
          ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
          : "bg-blue-500/10 text-blue-300 border-blue-500/30",
      };
    case "ai":
      return {
        icon: Bot,
        bg: isCritical || isHigh
          ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
          : "bg-amber-500/10 text-amber-300 border-amber-500/30",
      };
    case "risk":
      return {
        icon: ShieldAlert,
        bg: isCritical
          ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
          : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      };
    default:
      return {
        icon: Layers,
        bg: "bg-[#18181B] text-[#A1A1AA] border-[#27272A]",
      };
  }
}

/**
 * EvidenceGraph Component (Directed Evidence Relational Graph)
 *
 * Displays a lightweight structured evidence relationship graph linking
 * the email, transmission relays, sender identity, URLs, domains, authentication,
 * threat intelligence, and the final risk assessment.
 *
 * @param {Object} props
 * @param {Object} props.result - Complete analysis result object.
 */
export default function EvidenceGraph({ result }) {
  if (!result) return null;

  const { nodes = [], edges = [] } = generateEvidenceGraph({
    metadata: result.metadata || {},
    artifacts: result.artifacts || {},
    authentication: result.authentication || {},
    threatIntel: result.threatIntel || {},
    aiResult: {
      indicators: result.indicators || [],
      summary: result.summary || "",
    },
    riskData: {
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      classification: result.classification,
    },
  });

  if (nodes.length === 0) return null;

  return (
    <div className="space-y-4 rounded-xl border border-[#27272A] bg-[#111113] p-5 shadow-2xs">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#18181B] text-purple-400 border border-[#27272A]">
            <Share2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
              Evidence Relationship Graph
            </h3>
            <p className="text-[11px] text-[#71717A]">
              Artifact linkage, transmission paths, and risk contribution dependencies
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-[#71717A]">
          {nodes.length} Nodes • {edges.length} Connections
        </span>
      </div>

      {/* Nodes Overview Grid */}
      <div className="space-y-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#71717A]">
          Identified Forensic Nodes
        </span>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {nodes.map((node) => {
            const config = getNodeConfig(node.type, node.severity);
            const NodeIcon = config.icon;

            return (
              <div
                key={node.id}
                className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-xs shadow-2xs ${config.bg}`}
              >
                <NodeIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{node.label}</span>
                    <span className="text-[9px] uppercase tracking-wider opacity-70 font-mono">
                      {node.type}
                    </span>
                  </div>
                  {node.sublabel && (
                    <p className="mt-0.5 truncate font-mono text-[10px] opacity-85">
                      {node.sublabel}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Directed Graph Relationships Table/List */}
      {edges.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#71717A]">
            Relational Linkages ({edges.length})
          </span>

          <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-lg border border-[#27272A] bg-[#141417] p-3 text-xs">
            {edges.map((edge, idx) => {
              const srcNode = nodes.find((n) => n.id === edge.source);
              const tgtNode = nodes.find((n) => n.id === edge.target);

              if (!srcNode || !tgtNode) return null;

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 text-[11px] text-[#D4D4D8]"
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                    <span className="font-semibold text-[#F4F4F5] truncate font-mono">
                      {srcNode.label}
                    </span>
                    <ArrowRight className="h-3 w-3 shrink-0 text-[#71717A]" />
                    <span className="rounded bg-[#18181B] px-1.5 py-0.2 text-[9px] font-mono text-indigo-400 border border-[#27272A] shrink-0">
                      {edge.label}
                    </span>
                    <ArrowRight className="h-3 w-3 shrink-0 text-[#71717A]" />
                    <span className="font-semibold text-[#F4F4F5] truncate font-mono">
                      {tgtNode.label}
                    </span>
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
