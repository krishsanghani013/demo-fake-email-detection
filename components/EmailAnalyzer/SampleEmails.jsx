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
 * Renders controlled demo scenario cards enabling fast, reliable demonstration
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
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
          <span>Quick Demonstration Scenarios</span>
        </div>
        <span className="text-[10px] text-[#64748B] font-mono">1-Click Test Ingress</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DEMO_EMAILS.map((sample) => {
          const Icon = getSampleIcon(sample.id);

          return (
            <button
              key={sample.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectSample && onSelectSample(sample.emailText)}
              className="group flex flex-col items-start rounded-xl border border-[#1C2436] bg-[#111723] p-3.5 text-left shadow-2xs transition-all hover:border-blue-500/50 hover:bg-[#161D2D] focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#161D2D] text-blue-400 border border-[#253046] group-hover:border-blue-500/40 group-hover:text-blue-300">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="rounded-md border border-[#253046] bg-[#161D2D] px-2 py-0.5 text-[10px] font-mono font-semibold text-[#94A3B8]">
                  {sample.badge || "Scenario"}
                </span>
              </div>

              <h4 className="mt-2.5 text-xs font-semibold text-[#F8FAFC] transition-colors group-hover:text-blue-300">
                {sample.title}
              </h4>
              <p className="mt-1 line-clamp-2 text-[11px] text-[#94A3B8] leading-relaxed">
                {sample.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
