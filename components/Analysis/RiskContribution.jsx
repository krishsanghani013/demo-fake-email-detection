import React from "react";
import { PlusCircle } from "lucide-react";

/**
 * RiskContribution Component
 *
 * Renders a consistent, color-coded points contribution badge (+X pts).
 *
 * @param {Object} props
 * @param {number} props.points - The numeric risk contribution points.
 * @param {"low"|"medium"|"high"|"critical"} [props.severity] - Optional severity to align styling.
 * @param {string} [props.className=""] - Optional additional CSS classes.
 */
export default function RiskContribution({ points = 0, severity, className = "" }) {
  const num = Number(points) || 0;

  // Determine color scheme based on points and/or severity
  let colorClasses = "text-blue-400 bg-blue-500/10 border-blue-500/20";
  if (severity === "critical" || num >= 15) {
    colorClasses = "text-rose-400 bg-rose-500/10 border-rose-500/25";
  } else if (severity === "high" || num >= 10) {
    colorClasses = "text-orange-400 bg-orange-500/10 border-orange-500/25";
  } else if (severity === "medium" || num >= 5) {
    colorClasses = "text-amber-400 bg-amber-500/10 border-amber-500/25";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-xs font-bold tracking-tight shadow-2xs ${colorClasses} ${className}`}
      title={`Contributes +${num} risk points to the overall score`}
    >
      <PlusCircle className="h-3 w-3" />
      <span>+{num} pts</span>
    </span>
  );
}
