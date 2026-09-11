"use client";

import { useState, useRef, useEffect } from "react";
import {
  ShieldAlert,
  AlertCircle,
  Loader2,
  Trash2,
  UploadCloud,
  Edit3,
  CheckCircle2,
  Zap,
  Sparkles,
  ArrowRight,
  Shield,
  FileCheck,
} from "lucide-react";
import SampleEmails from "./SampleEmails";
import EmailFileUpload from "./EmailFileUpload";
import EmailPreview from "./EmailPreview";
import { calculateUnifiedRisk } from "@/lib/riskEngine";
import { saveCaseToStorage } from "@/lib/caseStorage";
import { useQuota } from "@/lib/quota";

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
  const quota = useQuota();
  const [activeTab, setActiveTab] = useState("paste"); // "paste" | "upload"
  const [emailText, setEmailText] = useState("");
  const [parsedEmailData, setParsedEmailData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStageIdx, setActiveStageIdx] = useState(0);
  const [error, setError] = useState(null);
  const isSubmittingRef = useRef(false);

  const charCount = emailText.length;
  const isTooShort = emailText.trim().length > 0 && emailText.trim().length < 10;
  const isSubmitDisabled = isLoading || emailText.trim().length < 10;

  // Simulate advancing stage progression while API request is in-flight
  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setActiveStageIdx((prev) => (prev < LOADING_STAGES.length - 1 ? prev + 1 : prev));
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

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
      setError("Paste an email or upload an .eml file to begin analysis.");
      return;
    }

    if (isSubmitDisabled || isSubmittingRef.current) return;

    if (quota.isExhausted) {
      setError(
        `AI Quota Exceeded (${quota.limit}/${quota.limit} used in this 12-hour window). Quota will auto-reset in ${quota.formattedTimeRemaining}.`
      );
      return;
    }

    isSubmittingRef.current = true;
    setActiveStageIdx(0);
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
          throw new Error("AI analysis service is temporarily unavailable. Please try again in a few moments.");
        }
        throw new Error(errorMsg || "Unable to analyze this email. Please try again.");
      }

      // If parsedEmailData is not already present from file upload, parse pasted email
      let currentParsed = parsedEmailData;
      if (!currentParsed && emailText.trim().length > 0) {
        try {
          const parseRes = await fetch("/api/parse-eml", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emlContent: emailText.trim() }),
          });
          if (parseRes.ok) {
            const parseJson = await parseRes.json();
            if (parseJson?.success && parseJson?.data) {
              currentParsed = parseJson.data;
            }
          }
        } catch (parseErr) {
          console.warn("Client-side EML parsing note:", parseErr);
        }
      }

      // Calculate unified risk combining deterministic heuristics + AI score
      if (result.data) {
        const unifiedRisk = calculateUnifiedRisk({
          aiResult: result.data,
          authentication: currentParsed?.authentication || null,
          identity: currentParsed?.identity || null,
          consistency: currentParsed?.consistency || null,
          threatIntel: currentParsed?.threatIntel || null,
          artifacts: currentParsed?.artifacts || null,
        });

        const combinedResult = {
          ...result.data,
          verdict: unifiedRisk.verdict,
          riskScore: unifiedRisk.riskScore,
          riskLevel: unifiedRisk.riskLevel,
          classification: unifiedRisk.classification,
          confidence: unifiedRisk.confidence,
          evidence: unifiedRisk.evidence,
          breakdown: unifiedRisk.breakdown,
          categoryScores: unifiedRisk.categoryScores,
          aiRiskScore: unifiedRisk.aiRiskScore,
          authentication: currentParsed?.authentication || null,
          identity: currentParsed?.identity || null,
          consistency: currentParsed?.consistency || null,
          threatIntel: currentParsed?.threatIntel || null,
          artifacts: currentParsed?.artifacts || null,
          metadata: currentParsed?.metadata || {
            from: "Extracted from Plain Text",
            subject: "Pasted Email Forensics Scan",
            date: new Date().toISOString(),
          },
          body: currentParsed?.body || { text: emailText },
          urls: currentParsed?.urls || [],
          attachments: currentParsed?.attachments || [],
        };

        // Automatically persist investigation into Prisma & Supabase
        try {
          await saveCaseToStorage(combinedResult);
        } catch (saveErr) {
          console.warn("[Client] Case persistence warning:", saveErr);
        }

        onAnalysisComplete(combinedResult);
      }
    } catch (err) {
      console.error("Email analysis error:", err?.message || err);
      setError(
        err?.message || "Unable to analyze this email. Please verify connection and try again."
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
    <div className="space-y-6 rounded-xl border border-[#1C2436] bg-[#111723] p-6 shadow-2xs">
      {/* Input Method Navigation Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#1C2436] pb-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F8FAFC]">
            Email Ingress & Source Telemetry
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Input raw RFC 5322 .eml or paste email headers and body content
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg bg-[#161D2D] p-1 border border-[#253046]">
          <button
            type="button"
            onClick={() => setActiveTab("paste")}
            disabled={isLoading}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "paste"
                ? "bg-[#1D263B] text-[#F8FAFC] border border-[#384A6E] shadow-xs"
                : "text-[#94A3B8] hover:text-[#F8FAFC]"
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
                ? "bg-[#1D263B] text-[#F8FAFC] border border-[#384A6E] shadow-xs"
                : "text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Upload .eml</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Paste Email */}
      {activeTab === "paste" && (
        <div className="space-y-5">
          <SampleEmails onSelectSample={handleSelectSample} disabled={isLoading} />

          <div className="border-t border-[#1C2436]" />

          <div className="relative">
            <div className="flex items-center justify-between pb-2 text-[11px] text-[#94A3B8]">
              <span className="font-medium">Raw Email Header & Body Content (RFC 5322)</span>
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
              placeholder="Paste raw email content here (e.g. From, To, Subject, Received headers, body text, or suspicious links)..."
              className="w-full resize-y rounded-xl border border-[#1C2436] bg-[#0D111A] p-4 font-mono text-xs leading-relaxed text-[#F8FAFC] placeholder-[#64748B] focus:border-blue-500 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
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
          <div className="flex items-center gap-3 text-xs font-mono text-[#94A3B8]">
            <span>{charCount.toLocaleString()} bytes ready for inspection</span>
            {isTooShort && (
              <span className="text-amber-400">
                (Min 10 characters required)
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Executing Forensic Analysis...</span>
              </>
            ) : (
              <>
                <ShieldAlert className="h-4 w-4" />
                <span>Analyze Email</span>
              </>
            )}
          </button>
        </div>

        {/* Real-time Investigation Progress UI with Staged Step Indicator */}
        {isLoading && (
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-blue-300">
                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                <span>Analyzing Email Artifacts & Threat Signals</span>
              </div>
              <span className="font-mono text-xs text-blue-400 font-semibold">
                Stage {activeStageIdx + 1} of {LOADING_STAGES.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {LOADING_STAGES.map((stage, idx) => {
                const isPast = idx < activeStageIdx;
                const isCurrent = idx === activeStageIdx;

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2.5 rounded-lg p-3 text-xs border transition-all ${
                      isCurrent
                        ? "bg-[#161D2D] text-[#F8FAFC] border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                        : isPast
                        ? "bg-[#111723] text-emerald-400 border-emerald-500/30"
                        : "bg-[#0D111A] text-[#64748B] border-[#1C2436]"
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-mono font-bold border ${
                        isCurrent
                          ? "bg-blue-500/20 text-blue-400 border-blue-500/40 animate-pulse"
                          : isPast
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                          : "bg-[#161D2D] text-[#64748B] border-[#253046]"
                      }`}
                    >
                      {isPast ? "✓" : idx + 1}
                    </div>
                    <span className="truncate">{stage}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* User-friendly Error Alert */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-200">Analysis Ingress Notice</p>
              <p className="text-[11px] leading-relaxed text-rose-300/90">{error}</p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
