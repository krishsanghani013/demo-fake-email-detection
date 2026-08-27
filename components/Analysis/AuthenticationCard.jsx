import React from "react";
import AuthenticationResults from "@/components/EmailAnalyzer/AuthenticationResults";

/**
 * AuthenticationCard Component
 *
 * Wrapper displaying AuthenticationResults for forensic analysis dashboards.
 *
 * @param {Object} props
 * @param {Object} props.authentication - Parsed authentication results.
 * @param {Object} [props.identity={}] - Extracted identity domains.
 * @param {Object} [props.consistency={}] - Domain consistency report.
 * @param {Array<Object>} [props.receivedHeaders=[]] - Received header hops.
 */
export default function AuthenticationCard({
  authentication,
  identity = {},
  consistency = {},
  receivedHeaders = [],
}) {
  if (!authentication) return null;

  return (
    <AuthenticationResults
      authentication={authentication}
      identity={identity}
      consistency={consistency}
      receivedHeaders={receivedHeaders}
    />
  );
}
