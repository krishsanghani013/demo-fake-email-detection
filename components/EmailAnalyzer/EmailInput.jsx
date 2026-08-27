"use client";

import { useState, useRef } from "react";
import {
  ShieldAlert,
  AlertCircle,
  Loader2,
  Trash2,
  UploadCloud,
  Edit3,
  CheckCircle2,
  Radio,
  Zap,
} from "lucide-react";
import SampleEmails from "./SampleEmails";
import EmailFileUpload from "./EmailFileUpload";
import EmailPreview from "./EmailPreview";
import { calculateUnifiedRisk } from "@/lib/riskEngine";
import { saveCaseToStorage } from "@/lib/caseStorage";

/**
 * Visual loading stages shown while the forensic AI analysis is in progress.
 */
const LOADING_STAGES = [
  "Parsing RFC 5322 headers & structure",
  "Evaluating SPF/DKIM/DMARC authentication",
  "Extracting URL & IP infrastructure artifacts",
  "Executing threat intelligence queries",
  "Running AI deception & content analysis",
  "Calculating explainable risk score",
];

/**
 * EmailInput Component (Dark SOC Investigation Input)
 *
 * Provides two input methods:
 * 1. Paste Email (with 4 one-click demo scenarios)
 * 2. Upload .eml file (with metadata preview and artifact extraction)
 *
 * @param {Object} props
 * @param {Function} props.onAnalysisComplete - Callback invoked with the parsed analysis result object.
 */
export default function EmailInput({ onAnalysisComplete }) {
  const [activeTab, setActiveTab] = useState("paste"); // "paste" | "upload"
  const [emailText, setEmailText] = useState("");
  const [parsedEmailData, setParsedEmailData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const isSubmittingRef = useRef(false);

  const charCount = emailText.length;
  const isTooShort = emailText.trim().length > 0 && emailText.trim().length < 10;
  const isSubmitDisabled = isLoading || emailText.trim().length < 10;

  function handleSelectSample(sampleContent) {
    if (isLoading || isSubmittingRef.current) return;
    setActiveTab("paste");
    setEmailText(sampleContent);
    setParsedEmailData(null);
    setError(null);
  }

  function handleEmailParsed(parsed) {
    setParsedEmailData(parsed);
    setEmailText(parsed.formattedTextForAnalysis || parsed.body?.text || "");
    setError(null);
  }

  function handleResetEml() {
    setParsedEmailData(null);
    setEmailText("");
    setError(null);
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault();

    if (emailText.trim().length === 0) {
      setError("Paste an email or upload an .eml file above to begin analysis.");
      return;
    }

    if (isSubmitDisabled || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailText.trim() }),
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonErr) {
        throw new Error("Unable to analyze this email. Please try again.");
      }

      if (!response.ok || !result?.success) {
        const errorMsg = result?.error || "";
        if (
          errorMsg.includes("503") ||
          errorMsg.includes("demand") ||
          errorMsg.includes("unavailable") ||
          errorMsg.includes("429") ||
          errorMsg.includes("quota")
        ) {
          throw new Error("AI analysis is temporarily unavailable. Please try again later.");
        }
        throw new Error(errorMsg || "Unable to analyze this email. Please try again.");
      }

      if (typeof onAnalysisComplete === "function") {
        const unifiedRisk = calculateUnifiedRisk({
          aiResult: result.data,
          authentication: parsedEmailData?.authentication || null,
          identity: parsedEmailData?.identity || null,
          consistency: parsedEmailData?.consistency || null,
          threatIntel: parsedEmailData?.threatIntel || null,
          artifacts: parsedEmailData?.artifacts || null,
        });

        const combinedResult = {
          ...result.data,
          riskScore: unifiedRisk.riskScore,
          riskLevel: unifiedRisk.riskLevel,
          classification: unifiedRisk.classification,
          confidence: unifiedRisk.confidence,
          breakdown: unifiedRisk.breakdown,
          categoryScores: unifiedRisk.categoryScores,
          aiRiskScore: unifiedRisk.aiRiskScore,
          authentication: parsedEmailData?.authentication || null,
          identity: parsedEmailData?.identity || null,
          consistency: parsedEmailData?.consistency || null,
          threatIntel: parsedEmailData?.threatIntel || null,
          artifacts: parsedEmailData?.artifacts || null,
          metadata: parsedEmailData?.metadata || {
            from: "Extracted from Plain Text",
            subject: "Pasted Email Forensics Scan",
            date: new Date().toISOString(),
          },
          body: parsedEmailData?.body || { text: emailText },
        };

        // Automatically persist investigation into local history for dashboard
        saveCaseToStorage(combinedResult);

        onAnalysisComplete(combinedResult);
      }
    } catch (err) {
      console.error("Email analysis error:", err?.message || err);
      setError(
        err?.message || "Unable to analyze this email. Please try again."
      );
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  }

  function handleClear() {
    setEmailText("");
    setParsedEmailData(null);
    setError(null);
  }

  return (
    <div className="space-y-5 rounded-xl border border-[#27272A] bg-[#111113] p-6 shadow-2xs">
      {/* Input Method Navigation Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#27272A] pb-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F4F4F5]">
            New Investigation Ingress
          </h2>
          <p className="text-xs text-[#71717A]">
            Input raw RFC 5322 .eml or paste plain-text email content
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg bg-[#18181B] p-1 border border-[#27272A]">
          <button
            type="button"
            onClick={() => setActiveTab("paste")}
            disabled={isLoading}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "paste"
                ? "bg-[#27272A] text-[#F4F4F5] shadow-xs"
                : "text-[#71717A] hover:text-[#F4F4F5]"
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Paste Email</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            disabled={isLoading}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "upload"
                ? "bg-[#27272A] text-[#F4F4F5] shadow-xs"
                : "text-[#71717A] hover:text-[#F4F4F5]"
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Upload .eml</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Paste Email */}
      {activeTab === "paste" && (
        <div className="space-y-4">
          <SampleEmails onSelectSample={handleSelectSample} disabled={isLoading} />

          <div className="border-t border-[#27272A]" />

          <div className="relative">
            <div className="flex items-center justify-between pb-1.5 text-[11px] text-[#71717A]">
              <span>Raw Email Header & Body Content</span>
              {emailText && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isLoading}
                  className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear Content</span>
                </button>
              )}
            </div>

            <textarea
              id="email-forensics-textarea"
              rows={9}
              value={emailText}
              onChange={(e) => {
                setEmailText(e.target.value);
                if (error) setError(null);
              }}
              disabled={isLoading}
              placeholder="Paste the raw email content (headers, subject, sender, body, links, or invoice details)..."
              className="w-full resize-y rounded-xl border border-[#27272A] bg-[#141417] p-4 font-mono text-xs leading-relaxed text-[#F4F4F5] placeholder-[#71717A] focus:border-indigo-500 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </div>
      )}

      {/* Mode 2: Upload .eml File */}
      {activeTab === "upload" && (
        <div className="space-y-4">
          {!parsedEmailData ? (
            <EmailFileUpload onEmailParsed={handleEmailParsed} disabled={isLoading} />
          ) : (
            <EmailPreview parsedEmail={parsedEmailData} onReset={handleResetEml} />
          )}
        </div>
      )}

      {/* Analysis Action Bar & Form Submit */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-xs font-mono text-[#71717A]">
            <span>{charCount.toLocaleString()} bytes ready for inspection</span>
            {isTooShort && (
              <span className="text-amber-400">
                (Min 10 chars required)
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 text-xs font-semibold text-white shadow-xs transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Executing Forensic Analysis...</span>
              </>
            ) : (
              <>
                <ShieldAlert className="h-4 w-4" />
                <span>Execute Investigation</span>
              </>
            )}
          </button>
        </div>

        {/* Real-time Investigation Progress UI */}
        {isLoading && (
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-300">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
              <span>Analyzing Email Artifacts & Threat Signals</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {LOADING_STAGES.map((stage, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-lg bg-[#141417] p-2.5 text-xs text-[#A1A1AA] border border-[#27272A]"
                >
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-mono font-bold text-indigo-400 border border-indigo-500/30">
                    {idx + 1}
                  </div>
                  <span className="truncate">{stage}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error State Banner */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <div className="flex-1">
              <p className="font-semibold text-[#F4F4F5]">Analysis Alert</p>
              <p className="mt-0.5 leading-relaxed text-rose-300">
                {error}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-xs font-semibold text-rose-400 underline hover:text-rose-200"
            >
              Dismiss
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
