import React, { useState } from "react";
import { Download, FileJson, FileText, CheckCircle2, AlertCircle, Eye } from "lucide-react";
import { createInvestigationSnapshot } from "@/lib/investigationSnapshot";
import { exportJsonReport, exportPdfReport } from "@/lib/reportGenerator";

/**
 * ExportControls Component (Dark SOC Theme)
 */
export default function ExportControls({
  result,
  onToggleReportView,
  isReportViewOpen = false,
}) {
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);

  const isEnabled = Boolean(result && result.riskScore !== undefined);

  const handleExportJson = () => {
    if (!isEnabled) {
      setExportStatus({ type: "error", message: "Complete an analysis before exporting a report." });
      return;
    }

    try {
      setIsExportingJson(true);
      setExportStatus(null);
      const snapshot = createInvestigationSnapshot(result);
      exportJsonReport(snapshot);
      setExportStatus({ type: "success", message: "JSON evidence report downloaded successfully." });
    } catch (err) {
      console.error("JSON Export Error:", err);
      setExportStatus({ type: "error", message: "Failed to generate JSON evidence export." });
    } finally {
      setIsExportingJson(false);
    }
  };

  const handleExportPdf = () => {
    if (!isEnabled) {
      setExportStatus({ type: "error", message: "Complete an analysis before exporting a report." });
      return;
    }

    try {
      setIsExportingPdf(true);
      setExportStatus(null);
      const snapshot = createInvestigationSnapshot(result);
      exportPdfReport(snapshot);
      setExportStatus({ type: "success", message: "Forensic PDF report generated successfully." });
    } catch (err) {
      console.error("PDF Export Error:", err);
      setExportStatus({ type: "error", message: "Failed to generate PDF forensic report." });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-[#27272A] bg-[#111113] p-4 shadow-2xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F4F4F5]">
            Forensic Evidence & Report Export
          </h4>
          <p className="text-[11px] text-[#71717A]">
            Preserve reproducible snapshot as JSON or structured PDF
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Report Toggle */}
          {onToggleReportView && (
            <button
              type="button"
              onClick={onToggleReportView}
              disabled={!isEnabled}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-2xs transition-all ${
                isEnabled
                  ? "border-[#27272A] bg-[#18181B] text-[#F4F4F5] hover:bg-[#27272A]"
                  : "cursor-not-allowed border-[#27272A] bg-[#141417] text-[#71717A]"
              }`}
            >
              <Eye className="h-3.5 w-3.5 text-indigo-400" />
              <span>{isReportViewOpen ? "Hide Briefing" : "View Briefing"}</span>
            </button>
          )}

          {/* Export JSON Button */}
          <button
            type="button"
            onClick={handleExportJson}
            disabled={!isEnabled || isExportingJson}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-2xs transition-all ${
              isEnabled
                ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
                : "cursor-not-allowed border-[#27272A] bg-[#141417] text-[#71717A]"
            }`}
          >
            <FileJson className="h-3.5 w-3.5 text-indigo-400" />
            <span>{isExportingJson ? "Exporting..." : "Export JSON"}</span>
          </button>

          {/* Export PDF Button */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={!isEnabled || isExportingPdf}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-2xs transition-all ${
              isEnabled
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                : "cursor-not-allowed border-[#27272A] bg-[#141417] text-[#71717A]"
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-emerald-400" />
            <span>{isExportingPdf ? "Generating..." : "Export PDF"}</span>
          </button>
        </div>
      </div>

      {/* Status Feedback Banner */}
      {exportStatus && (
        <div
          className={`flex items-center gap-2 rounded-lg p-2.5 text-xs ${
            exportStatus.type === "success"
              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border border-rose-500/30 bg-rose-500/10 text-rose-300"
          }`}
        >
          {exportStatus.type === "success" ? (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
          )}
          <span>{exportStatus.message}</span>
        </div>
      )}
    </div>
  );
}
