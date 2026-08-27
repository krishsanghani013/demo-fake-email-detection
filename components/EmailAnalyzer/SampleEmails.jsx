import React from "react";
import { DEMO_EMAILS } from "@/data/demoEmails";
import { Sparkles, Mail, ShieldAlert, AlertTriangle, ShieldCheck, Server } from "lucide-react";

/**
 * Returns an icon for each demo sample type.
 */
function getSampleIcon(id) {
  switch (id) {
    case "legitimate":
      return ShieldCheck;
    case "suspicious":
      return AlertTriangle;
    case "phishing":
      return ShieldAlert;
    case "malicious-infra":
      return Server;
    default:
      return Mail;
  }
}

/**
 * SampleEmails Component (Dark SOC Theme Scenario Selector)
 *
 * Renders controlled demo scenario buttons enabling fast, reliable demonstration
 * of legitimate, suspicious, phishing, and infrastructure threats.
 *
 * @param {Object} props
 * @param {Function} props.onSelectSample - Callback fired when a sample is selected.
 * @param {boolean} [props.disabled=false] - Whether buttons should be disabled.
 */
export default function SampleEmails({ onSelectSample, disabled = false }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#71717A]">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>Demo Scenarios (One-Click Ingress)</span>
        </div>
        <span className="text-[10px] text-[#71717A] font-mono">Click to populate</span>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {DEMO_EMAILS.map((sample) => {
          const Icon = getSampleIcon(sample.id);

          return (
            <button
              key={sample.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectSample && onSelectSample(sample.emailText)}
              className="group flex flex-col items-start rounded-xl border border-[#27272A] bg-[#141417] p-3 text-left shadow-2xs transition-all hover:border-indigo-500/50 hover:bg-[#18181B] focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#18181B] text-indigo-400 border border-[#27272A] group-hover:border-indigo-500/40">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="rounded-md border border-[#27272A] bg-[#18181B] px-1.5 py-0.2 text-[9px] font-mono font-semibold text-[#A1A1AA]">
                  {sample.badge || "Demo"}
                </span>
              </div>

              <h4 className="mt-2 text-xs font-semibold text-[#F4F4F5] transition-colors group-hover:text-indigo-300">
                {sample.title}
              </h4>
              <p className="mt-0.5 line-clamp-2 text-[11px] text-[#71717A] leading-relaxed">
                {sample.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
