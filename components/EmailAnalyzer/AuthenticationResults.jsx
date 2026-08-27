import React, { useState } from "react";
import {
  MailCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Info,
  GitCompare,
  Network,
  ChevronDown,
  ChevronUp,
  KeyRound,
} from "lucide-react";

/**
 * Returns color classes and labels for authentication protocol status values.
 */
function getStatusBadgeConfig(status) {
  const norm = String(status || "").toLowerCase().trim();

  switch (norm) {
    case "pass":
      return {
        label: "PASS",
        badgeClass:
          "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        icon: CheckCircle2,
      };
    case "fail":
    case "permerror":
      return {
        label: norm.toUpperCase(),
        badgeClass:
          "border border-rose-500/30 bg-rose-500/10 text-rose-400",
        icon: XCircle,
      };
    case "softfail":
    case "temperror":
      return {
        label: norm.toUpperCase(),
        badgeClass:
          "border border-amber-500/30 bg-amber-500/10 text-amber-400",
        icon: AlertTriangle,
      };
    case "present":
      return {
        label: "PRESENT",
        badgeClass:
          "border border-blue-500/30 bg-blue-500/10 text-blue-400",
        icon: KeyRound,
      };
    case "none":
    case "neutral":
      return {
        label: norm.toUpperCase(),
        badgeClass:
          "border border-[#27272A] bg-[#18181B] text-[#A1A1AA]",
        icon: Info,
      };
    default:
      return {
        label: "NOT AVAILABLE",
        badgeClass:
          "border border-[#27272A] bg-[#18181B] text-[#71717A]",
        icon: HelpCircle,
      };
  }
}

/**
 * Returns explainable descriptive text for SPF status.
 */
function getSpfExplanation(spf) {
  if (!spf || spf.status === "not_available") {
    return "No SPF authentication result was found in the available headers.";
  }
  const source = spf.source || "Mail headers";
  const st = String(spf.status).toUpperCase();
  return `${source} reports SPF ${st}.`;
}

/**
 * Returns explainable descriptive text for DKIM status.
 */
function getDkimExplanation(dkim) {
  if (!dkim || dkim.status === "not_available") {
    return "No DKIM authentication result or signature was found in the headers.";
  }
  if (dkim.status === "present") {
    return "DKIM signature is present, but no successful DKIM authentication result was found.";
  }
  const source = dkim.source || "Mail headers";
  const st = String(dkim.status).toUpperCase();
  return `${source} reports DKIM ${st}.${dkim.signingDomain ? ` Signed by ${dkim.signingDomain}.` : ""}`;
}

/**
 * Returns explainable descriptive text for DMARC status.
 */
function getDmarcExplanation(dmarc) {
  if (!dmarc || dmarc.status === "not_available") {
    return "No DMARC authentication result was found in the available headers.";
  }
  const source = dmarc.source || "Authentication-Results";
  const st = String(dmarc.status).toUpperCase();
  return `${source} reports DMARC ${st}.${dmarc.policy ? ` Policy: ${dmarc.policy}.` : ""}`;
}

/**
 * AuthenticationResults Component (Technical SPF, DKIM, DMARC & Sender Consistency)
 *
 * Displays reported SPF, DKIM, and DMARC evidence, sender domain consistency,
 * and a collapsible Mail Server Chain for Received headers inspection.
 *
 * @param {Object} props
 * @param {Object} props.authentication - Authentication results object.
 * @param {Object} [props.identity={}] - Extracted identity domains.
 * @param {Object} [props.consistency={}] - Consistency findings.
 * @param {Array<Object>} [props.receivedHeaders=[]] - Parsed Received header hops.
 */
export default function AuthenticationResults({
  authentication,
  identity = {},
  consistency = {},
  receivedHeaders = [],
}) {
  const [showServerChain, setShowServerChain] = useState(false);

  if (!authentication) return null;

  const spf = authentication.spf || {};
  const dkim = authentication.dkim || {};
  const dmarc = authentication.dmarc || {};

  const spfConfig = getStatusBadgeConfig(spf.status);
  const dkimConfig = getStatusBadgeConfig(dkim.status);
  const dmarcConfig = getStatusBadgeConfig(dmarc.status);

  const SpfIcon = spfConfig.icon;
  const DkimIcon = dkimConfig.icon;
  const DmarcIcon = dmarcConfig.icon;

  const observations = Array.isArray(consistency.observations)
    ? consistency.observations
    : [];

  const hops = Array.isArray(receivedHeaders) ? receivedHeaders : [];

  return (
    <div className="space-y-4 rounded-xl border border-[#27272A] bg-[#111113] p-5 shadow-2xs">
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#18181B] text-blue-400 border border-[#27272A]">
            <MailCheck className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
              Technical Email Authentication
            </h3>
            <p className="text-[11px] text-[#71717A]">
              Reported SPF, DKIM, and DMARC mail server verification evidence
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-[#71717A]">
          RFC Validation
        </span>
      </div>

      {/* 2. Protocol Cards Grid: SPF, DKIM, DMARC */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* SPF Card */}
        <div className="rounded-lg border border-[#27272A] bg-[#141417] p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F4F4F5]">
              SPF
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold font-mono uppercase ${spfConfig.badgeClass}`}
            >
              <SpfIcon className="h-3 w-3" />
              <span>{spfConfig.label}</span>
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#A1A1AA]">
            {getSpfExplanation(spf)}
          </p>
          {spf.domain && (
            <p className="truncate font-mono text-[10px] text-[#71717A]">
              Domain: {spf.domain}
            </p>
          )}
        </div>

        {/* DKIM Card */}
        <div className="rounded-lg border border-[#27272A] bg-[#141417] p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F4F4F5]">
              DKIM
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold font-mono uppercase ${dkimConfig.badgeClass}`}
            >
              <DkimIcon className="h-3 w-3" />
              <span>{dkimConfig.label}</span>
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#A1A1AA]">
            {getDkimExplanation(dkim)}
          </p>
          {dkim.signingDomain && (
            <p className="truncate font-mono text-[10px] text-[#71717A]">
              Signed: {dkim.signingDomain}
            </p>
          )}
        </div>

        {/* DMARC Card */}
        <div className="rounded-lg border border-[#27272A] bg-[#141417] p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F4F4F5]">
              DMARC
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold font-mono uppercase ${dmarcConfig.badgeClass}`}
            >
              <DmarcIcon className="h-3 w-3" />
              <span>{dmarcConfig.label}</span>
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#A1A1AA]">
            {getDmarcExplanation(dmarc)}
          </p>
          {dmarc.domain && (
            <p className="truncate font-mono text-[10px] text-[#71717A]">
              Policy domain: {dmarc.domain}
            </p>
          )}
        </div>
      </div>

      {/* 3. Sender Consistency Section */}
      <div className="rounded-lg border border-[#27272A] bg-[#141417] p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
            <GitCompare className="h-3.5 w-3.5 text-indigo-400" />
            <span>Sender & Alignment Consistency</span>
          </div>

          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${
              consistency.status === "mismatch_detected"
                ? "border border-amber-500/30 bg-amber-500/10 text-amber-400"
                : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            }`}
          >
            {consistency.status === "mismatch_detected" ? "MISMATCH DETECTED" : "ALIGNED"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 font-mono">
          <div className="rounded-md bg-[#18181B] p-2 border border-[#27272A]">
            <span className="text-[10px] font-semibold text-[#71717A]">From Domain</span>
            <p className="truncate text-[11px] text-[#F4F4F5]">
              {identity.fromDomain || "Not available"}
            </p>
          </div>

          <div className="rounded-md bg-[#18181B] p-2 border border-[#27272A]">
            <span className="text-[10px] font-semibold text-[#71717A]">Reply-To Domain</span>
            <p className="truncate text-[11px] text-[#F4F4F5]">
              {identity.replyToDomain || "None specified"}
            </p>
          </div>

          <div className="rounded-md bg-[#18181B] p-2 border border-[#27272A]">
            <span className="text-[10px] font-semibold text-[#71717A]">DKIM Domain</span>
            <p className="truncate text-[11px] text-[#F4F4F5]">
              {identity.dkimDomain || "Not signed"}
            </p>
          </div>

          <div className="rounded-md bg-[#18181B] p-2 border border-[#27272A]">
            <span className="text-[10px] font-semibold text-[#71717A]">SPF Domain</span>
            <p className="truncate text-[11px] text-[#F4F4F5]">
              {identity.spfDomain || "Not available"}
            </p>
          </div>
        </div>

        {/* Observations list */}
        {observations.length > 0 ? (
          <div className="space-y-1.5 border-t border-[#27272A] pt-2.5">
            {observations.map((obs, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-xs text-amber-300"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                <p className="text-[11px] leading-relaxed">
                  <span className="font-semibold text-amber-400">{obs.type}:</span> {obs.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Sender and authentication domains are aligned with no detected routing mismatches.</span>
          </div>
        )}
      </div>

      {/* 4. Collapsible Mail Server Chain */}
      {hops.length > 0 && (
        <div className="rounded-lg border border-[#27272A] bg-[#141417]">
          <button
            type="button"
            onClick={() => setShowServerChain((prev) => !prev)}
            className="flex w-full items-center justify-between p-3 text-left text-xs font-semibold text-[#F4F4F5] hover:bg-[#18181B] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-purple-400" />
              <span>Mail Server Relay Hop Chain ({hops.length} Hops Recorded)</span>
            </div>
            {showServerChain ? (
              <ChevronUp className="h-4 w-4 text-[#71717A]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#71717A]" />
            )}
          </button>

          {showServerChain && (
            <div className="space-y-2 border-t border-[#27272A] p-3 text-xs">
              {hops.map((hop, idx) => (
                <div
                  key={idx}
                  className="rounded-md border border-[#27272A] bg-[#18181B] p-2.5 text-[11px]"
                >
                  <div className="flex items-center justify-between font-semibold text-[#F4F4F5]">
                    <span>Hop #{hop.hopIndex}</span>
                    {hop.timestamp && (
                      <span className="font-mono text-[10px] text-[#71717A]">
                        {hop.timestamp}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 space-y-0.5 text-[#A1A1AA] font-mono text-[10px]">
                    {hop.fromHost && (
                      <p>
                        <span className="text-[#71717A]">From:</span> {hop.fromHost}
                      </p>
                    )}
                    {hop.byHost && (
                      <p>
                        <span className="text-[#71717A]">By:</span> {hop.byHost}
                      </p>
                    )}
                    {hop.ip && (
                      <p>
                        <span className="text-[#71717A]">Relay IP:</span> {hop.ip}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
