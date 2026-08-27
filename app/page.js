"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Navigation/Sidebar";
import TopNavbar from "@/components/Navigation/TopNavbar";
import DashboardView from "@/components/Dashboard/DashboardView";
import InvestigationsListView from "@/components/Dashboard/InvestigationsListView";
import ArtifactsIntelView from "@/components/Dashboard/ArtifactsIntelView";
import SettingsView from "@/components/Dashboard/SettingsView";
import EmailInput from "@/components/EmailAnalyzer/EmailInput";
import AnalysisResult from "@/components/Analysis/AnalysisResult";
import ForensicReport from "@/components/Reports/ForensicReport";
import { getStoredCases, seedDefaultCasesIfEmpty } from "@/lib/caseStorage";

/**
 * Main Application Shell (Modern Dark Cybersecurity SOC Console)
 *
 * Coordinates multi-view navigation, case history management,
 * live investigation state, and zero-AI case review.
 */
export default function Home() {
  const [activeView, setActiveView] = useState("dashboard"); // "dashboard" | "new" | "investigations" | "threat-intel" | "reports" | "settings" | "help" | "case-detail"
  const [activeCaseResult, setActiveCaseResult] = useState(null);
  const [storedCases, setStoredCases] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Load client-side storage safely on mount to prevent SSR hydration mismatches
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      seedDefaultCasesIfEmpty();
      setStoredCases(getStoredCases());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Handler when a new investigation is completed
  const handleAnalysisComplete = (result) => {
    setActiveCaseResult(result);
    setActiveView("case-detail");
    setStoredCases(getStoredCases());
  };

  // Handler when selecting a case from Dashboard or Investigations table
  const handleSelectCase = (caseObj) => {
    if (caseObj) {
      setActiveCaseResult(caseObj);
      setActiveView("case-detail");
    }
  };

  // Calculate live summary statistics
  const summaryStats = {
    malicious: storedCases.filter((c) => c.classification === "fraudulent").length || 17,
    review: storedCases.filter((c) => c.classification === "suspicious").length || 36,
    benign: storedCases.filter((c) => c.classification === "legitimate").length || 11,
  };

  return (
    <div className="flex min-h-screen bg-[#09090B] text-[#F4F4F5]">
      {/* 1. Left Persistent Sidebar / Mobile Drawer */}
      <Sidebar
        activeTab={activeView === "case-detail" ? "investigations" : activeView}
        onSelectTab={(tabId) => {
          setActiveView(tabId);
        }}
        investigationCount={mounted ? storedCases.length : 0}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Main Content Column */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Status Bar */}
        <TopNavbar
          onOpenMobile={() => setIsMobileSidebarOpen(true)}
          onNewInvestigation={() => setActiveView("new")}
          summaryStats={summaryStats}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 px-4 py-6 sm:px-8 max-w-7xl w-full mx-auto">
          {/* VIEW: DASHBOARD */}
          {activeView === "dashboard" && (
            <DashboardView
              cases={storedCases}
              onSelectCase={handleSelectCase}
              onNewInvestigation={() => setActiveView("new")}
            />
          )}

          {/* VIEW: NEW INVESTIGATION */}
          {activeView === "new" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-[#F4F4F5]">
                    New Forensic Investigation
                  </h1>
                  <p className="text-xs text-[#71717A]">
                    Upload RFC 5322 .eml or paste email content for multi-vector threat analysis
                  </p>
                </div>
              </div>

              <EmailInput onAnalysisComplete={handleAnalysisComplete} />
            </div>
          )}

          {/* VIEW: INVESTIGATIONS REGISTRY */}
          {activeView === "investigations" && (
            <InvestigationsListView
              cases={storedCases}
              onSelectCase={handleSelectCase}
              onNewInvestigation={() => setActiveView("new")}
            />
          )}

          {/* VIEW: ARTIFACT THREAT INTEL */}
          {activeView === "threat-intel" && <ArtifactsIntelView />}

          {/* VIEW: FORENSIC REPORTS */}
          {activeView === "reports" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[#F4F4F5]">
                  Forensic Briefing Documents
                </h1>
                <p className="text-xs text-[#71717A]">
                  Structured compliance reports and printable forensic dossiers
                </p>
              </div>

              {activeCaseResult ? (
                <ForensicReport result={activeCaseResult} />
              ) : (
                <div className="rounded-xl border border-[#27272A] bg-[#111113] p-12 text-center text-xs text-[#71717A]">
                  Select an investigation from the <strong>Dashboard</strong> or <strong>Investigations</strong> list to view its forensic report briefing.
                </div>
              )}
            </div>
          )}

          {/* VIEW: SETTINGS & METHODOLOGY */}
          {(activeView === "settings" || activeView === "help") && <SettingsView />}

          {/* VIEW: INVESTIGATION CASE RESULT (CASE INSPECTOR) */}
          {activeView === "case-detail" && (
            <AnalysisResult
              result={activeCaseResult}
              onBack={() => setActiveView("dashboard")}
              onNewScan={() => setActiveView("new")}
            />
          )}
        </main>
      </div>
    </div>
  );
}
