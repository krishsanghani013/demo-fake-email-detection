import React from "react";
import ThreatIntelResults from "@/components/ThreatIntel/ThreatIntelResults";

/**
 * ThreatIntelCard Component
 *
 * Wrapper rendering ThreatIntelResults for analysis dashboards and preview views.
 *
 * @param {Object} props
 * @param {Object} props.threatIntel - Threat intelligence data.
 * @param {Object} [props.artifacts={}] - Extracted local artifact details.
 */
export default function ThreatIntelCard({ threatIntel, artifacts = {} }) {
  if (!threatIntel && !artifacts) return null;

  return <ThreatIntelResults threatIntel={threatIntel} artifacts={artifacts} />;
}
