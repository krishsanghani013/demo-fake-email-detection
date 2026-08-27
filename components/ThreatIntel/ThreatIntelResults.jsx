import React from "react";
import { Globe, Link2, Network, Layers, AlertCircle, Search } from "lucide-react";
import UrlIntelCard from "./UrlIntelCard";
import DomainIntelCard from "./DomainIntelCard";
import IpIntelCard from "./IpIntelCard";

/**
 * ThreatIntelResults Component (Dark SOC Artifact Intelligence Results)
 *
 * Primary container for displaying normalized threat intelligence for URLs,
 * root domains, and transmission IP hops with lookup limit warnings.
 *
 * @param {Object} props
 * @param {Object} props.threatIntel - Normalized threat intelligence results.
 * @param {Object} [props.artifacts={}] - Local artifact details.
 */
export default function ThreatIntelResults({ threatIntel, artifacts = {} }) {
  if (!threatIntel && !artifacts) return null;

  const urlIntel = Array.isArray(threatIntel?.urls) ? threatIntel.urls : [];
  const domainIntel = Array.isArray(threatIntel?.domains) ? threatIntel.domains : [];
  const ipIntel = Array.isArray(threatIntel?.ips) ? threatIntel.ips : [];

  const urlArtifacts = Array.isArray(artifacts?.urls) ? artifacts.urls : [];
  const ipArtifacts = Array.isArray(artifacts?.ips) ? artifacts.ips : [];

  const hasAnyData =
    urlIntel.length > 0 ||
    domainIntel.length > 0 ||
    ipIntel.length > 0 ||
    urlArtifacts.length > 0;

  if (!hasAnyData) {
    return (
      <div className="rounded-xl border border-[#27272A] bg-[#111113] p-5 text-center text-xs text-[#71717A] shadow-2xs">
        <Search className="mx-auto h-5 w-5 text-[#71717A]" />
        <p className="mt-2 font-medium">No external URL or IP artifacts detected for threat intelligence lookup.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-[#27272A] bg-[#111113] p-5 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#18181B] text-purple-400 border border-[#27272A]">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
              Artifact Threat Intelligence
            </h3>
            <p className="text-[11px] text-[#71717A]">
              Normalized external reputation & local heuristic artifact analysis
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-[#71717A]">
          Independent Intelligence
        </span>
      </div>

      {/* 1. URL Intelligence */}
      {urlIntel.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
            <div className="flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5 text-indigo-400" />
              <span>Extracted URLs & Reputation ({urlIntel.length})</span>
            </div>
            {threatIntel?.uncheckedUrlsCount > 0 && (
              <span className="text-[10px] text-amber-400 font-normal font-mono">
                ({threatIntel.uncheckedUrlsCount} additional URLs not checked due to limit)
              </span>
            )}
          </div>

          <div className="space-y-2">
            {urlIntel.map((item, idx) => {
              const matchingArt = urlArtifacts.find(
                (a) => a.normalized === item.artifact || a.original === item.artifact
              );
              return <UrlIntelCard key={idx} urlIntel={item} artifact={matchingArt} />;
            })}
          </div>
        </div>
      )}

      {/* 2. Domain Intelligence */}
      {domainIntel.length > 0 && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-emerald-400" />
              <span>Domain Intelligence ({domainIntel.length})</span>
            </div>
            {threatIntel?.uncheckedDomainsCount > 0 && (
              <span className="text-[10px] text-amber-400 font-normal font-mono">
                ({threatIntel.uncheckedDomainsCount} additional domains not checked)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {domainIntel.map((item, idx) => (
              <DomainIntelCard key={idx} domainIntel={item} />
            ))}
          </div>
        </div>
      )}

      {/* 3. IP Intelligence */}
      {ipIntel.length > 0 && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
            <div className="flex items-center gap-1.5">
              <Network className="h-3.5 w-3.5 text-purple-400" />
              <span>Transmission IP Intelligence ({ipIntel.length})</span>
            </div>
            {threatIntel?.uncheckedIpsCount > 0 && (
              <span className="text-[10px] text-amber-400 font-normal font-mono">
                ({threatIntel.uncheckedIpsCount} additional IPs not checked)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ipIntel.map((item, idx) => {
              const matchingIpArt = ipArtifacts.find((a) => a.ip === item.artifact);
              return <IpIntelCard key={idx} ipIntel={item} artifact={matchingIpArt} />;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
