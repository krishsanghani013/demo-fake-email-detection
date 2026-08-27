import React from "react";
import {
  Clock,
  Mail,
  Network,
  MailCheck,
  Link2,
  Globe,
  Bot,
  ShieldAlert,
  Info,
} from "lucide-react";
import { generateEvidenceTimeline } from "@/lib/evidenceTimeline";

/**
 * Returns icon, badge, and color styles for a timeline event type.
 */
function getEventVisuals(type, severity) {
  const isCritical = severity === "critical";
  const isHigh = severity === "high";

  switch (type) {
    case "email":
      return {
        icon: Mail,
        bg: "bg-indigo-500/10 text-indigo-400",
        border: "border-indigo-500/20",
      };
    case "received":
      return {
        icon: Network,
        bg: "bg-purple-500/10 text-purple-400",
        border: "border-purple-500/20",
      };
    case "authentication":
      return {
        icon: MailCheck,
        bg: isHigh || isCritical
          ? "bg-rose-500/10 text-rose-400"
          : "bg-blue-500/10 text-blue-400",
        border: isHigh || isCritical
          ? "border-rose-500/20"
          : "border-blue-500/20",
      };
    case "url":
      return {
        icon: Link2,
        bg: "bg-[#18181B] text-[#D4D4D8]",
        border: "border-[#27272A]",
      };
    case "threat-intelligence":
      return {
        icon: Globe,
        bg: isCritical
          ? "bg-rose-500/20 text-rose-300"
          : "bg-amber-500/20 text-amber-300",
        border: isCritical
          ? "border-rose-500/30"
          : "border-amber-500/30",
      };
    case "ai":
      return {
        icon: Bot,
        bg: "bg-emerald-500/10 text-emerald-400",
        border: "border-emerald-500/20",
      };
    case "risk":
      return {
        icon: ShieldAlert,
        bg: isCritical
          ? "bg-rose-500/20 text-rose-300"
          : "bg-indigo-500/20 text-indigo-300",
        border: isCritical
          ? "border-rose-500/30"
          : "border-indigo-500/30",
      };
    default:
      return {
        icon: Info,
        bg: "bg-[#18181B] text-[#A1A1AA]",
        border: "border-[#27272A]",
      };
  }
}

/**
 * EvidenceTimeline Component (Vertical Forensic Timeline)
 *
 * Displays a vertical chronological timeline representing the sequence of
 * transmissions, header processing, artifact discovery, and security evaluations.
 *
 * @param {Object} props
 * @param {Object} props.result - Complete analysis result object.
 */
export default function EvidenceTimeline({ result }) {
  if (!result) return null;

  const events = generateEvidenceTimeline({
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
      confidence: result.confidence,
    },
  });

  if (events.length === 0) return null;

  return (
    <div className="space-y-4 rounded-xl border border-[#27272A] bg-[#111113] p-5 shadow-2xs">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#18181B] text-amber-400 border border-[#27272A]">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
              Investigation Timeline
            </h3>
            <p className="text-[11px] text-[#71717A]">
              Chronological transmission and forensic evaluation sequence
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-[#71717A]">
          {events.length} Events
        </span>
      </div>

      {/* Vertical Timeline List */}
      <div className="relative pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#27272A]">
        <div className="space-y-3">
          {events.map((event, idx) => {
            const visuals = getEventVisuals(event.type, event.severity);
            const EventIcon = visuals.icon;

            return (
              <div key={event.id || idx} className="relative flex items-start gap-3.5">
                {/* Timeline Node Dot */}
                <div
                  className={`absolute -left-6 mt-1 flex h-5 w-5 items-center justify-center rounded-full border shadow-2xs ${visuals.bg} ${visuals.border}`}
                >
                  <EventIcon className="h-2.5 w-2.5" />
                </div>

                {/* Event Card */}
                <div className="min-w-0 flex-1 rounded-lg border border-[#27272A] bg-[#141417] p-3 text-xs">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="font-semibold text-[#F4F4F5]">
                      {event.title}
                    </h4>
                    <span className="font-mono text-[10px] text-[#71717A]">
                      {event.formattedTime}
                    </span>
                  </div>

                  <p className="mt-1 text-[11px] leading-relaxed text-[#D4D4D8]">
                    {event.description}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-[#71717A]">
                    <span>Source: {event.source}</span>
                    {event.severity && event.severity !== "info" && (
                      <span className="font-mono font-semibold uppercase tracking-wider text-rose-400">
                        {event.severity}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
