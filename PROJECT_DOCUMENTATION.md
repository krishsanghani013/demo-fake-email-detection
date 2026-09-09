# SIH 2026 — Explainable Email Forensics Platform
## Master Project Documentation & Architecture Blueprint

> **CRITICAL MAINTENANCE DIRECTIVE:**  
> This file is the **single source of truth** for all architectural, algorithmic, UI, and data model details of this project.  
> **Rule:** Every time any modification, feature addition, refactor, or bug fix is made to this codebase, **THIS FILE MUST BE UPDATED IMMEDIATELY** in the same turn to reflect the latest state.

---

## Table of Contents
1. [Project Overview & Vision](#1-project-overview--vision)
2. [Technology Stack](#2-technology-stack)
3. [Complete Codebase Directory & File Map](#3-complete-codebase-directory--file-map)
4. [Deterministic Risk Engine & Scoring Methodology](#4-deterministic-risk-engine--scoring-methodology)
5. [Feature #1: Evidence Chain & Explainability](#5-feature-1-evidence-chain--explainability)
6. [Data Models & Type Definitions](#6-data-models--type-definitions)
7. [Email Ingress & Analysis Pipeline](#7-email-ingress--analysis-pipeline)
8. [Threat Intelligence & Header Forensics Engine](#8-threat-intelligence--header-forensics-engine)
9. [UI Design System & SOC Interface](#9-ui-design-system--soc-interface)
10. [Security, Privacy & Anti-Hallucination Guarantees](#10-security-privacy--anti-hallucination-guarantees)
11. [Testing & Verification Suite](#11-testing--verification-suite)
12. [How to Run, Test, and Build](#12-how-to-run-test-and-build)
13. [Project Changelog](#13-project-changelog)

---

## 1. Project Overview & Vision

The **SIH 2026 Explainable Email Forensics Platform** is a cybersecurity investigation tool designed for Security Operations Center (SOC) analysts, incident responders, and fraud investigators.

### Core Problem:
Traditional email security gateways return opaque verdicts (e.g., `Spam: Yes`, `Score: 87/100`), forcing analysts to guess why a message was blocked or flagged.

### Our Solution:
An explainable email-forensics engine that ingests raw RFC 5322 emails or `.eml` files, extracts multi-vector evidence, and produces a **100% transparent, mathematically traceable verdict**:

$$\text{RAW EMAIL} \longrightarrow \text{OBSERVED EVIDENCE} \longrightarrow \text{ARTIFACT / SIGNAL} \longrightarrow \text{DETERMINISTIC ANALYSIS} \longrightarrow \text{RISK CONTRIBUTION} \longrightarrow \text{FINAL VERDICT} \longrightarrow \text{ACTIONABLE GUIDANCE}$$

### Core Tenet:
**Every single risk point must originate from verifiable forensic evidence discovered in headers, body content, authentication records, or threat intelligence feeds. The system NEVER invents or hallucinates forensic evidence.**

---

## 2. Technology Stack

- **Framework**: Next.js 16.3.3 (App Router, Turbopack, React Compiler)
- **Runtime & UI**: React 19.2.8, Tailwind CSS v4 (Dark Cyber SOC theme)
- **Icons**: Lucide React (`lucide-react` 1.38.0)
- **AI Engine**: Google Generative AI (`@google/generative-ai` 0.24.1) using `gemini-2.5-flash` with automatic offline deterministic fallback
- **Email Parsers**: 
  - `mailparser` 3.9.18 (RFC 5322 header decoding, MIME multipart parsing, attachment metadata extraction)
  - Custom pure-JS parser (`lib/emlParser.js`) for lightweight client/server parsing
- **Reporting & Export**: `jspdf` 4.2.1 (Vector PDF generation with selectable text), JSON export sanitizer (`lib/exportSanitizer.js`)
- **State & Local Persistence**: Privacy-safe browser `localStorage` (`lib/caseStorage.js`) with zero network leakage
- **Quota Management**: 12-hour rolling quota limiter (`lib/quota.js`) with test bypass

---

## 3. Complete Codebase Directory & File Map

```
d:/email-forensics-demo/
├── app/
│   ├── api/
│   │   ├── analyze/
│   │   │   └── route.js           # POST /api/analyze — AI content deception analysis endpoint
│   │   └── parse-eml/
│   │       └── route.js           # POST /api/parse-eml — RFC 5322 header & artifact parser endpoint
│   ├── favicon.ico                # SOC shield favicon
│   ├── globals.css                # Tailwind CSS v4 imports & dark SOC palette
│   ├── layout.js                  # Root HTML layout with metadata
│   └── page.js                    # Main SOC console tab router (Dashboard, New, Cases, Intel, Reports, Settings)
│
├── components/
│   ├── Analysis/
│   │   ├── AIExplanation.jsx      # AI executive summary & risk rationale card
│   │   ├── AnalysisResult.jsx     # Master investigation inspector with tabbed views (Overview, Headers, Auth, etc.)
│   │   ├── AuthenticationCard.jsx # SPF, DKIM, DMARC, ARC & hop chain inspector card
│   │   ├── ConfidenceScore.jsx    # Signal convergence percentage gauge
│   │   ├── EvidenceCard.jsx       # Reusable Evidence Chain item card (stable ID, points, quote, explanation)
│   │   ├── EvidenceCategory.jsx   # Budget meter for the 4 categories (points / cap progress bar)
│   │   ├── EvidenceList.jsx       # Filterable list of forensic evidence items with category tabs
│   │   ├── Recommendation.jsx     # Actionable containment guidance component
│   │   ├── RiskBadge.jsx          # Color-coded severity badge ([CRITICAL], [HIGH], [MEDIUM], [LOW])
│   │   ├── RiskBreakdown.jsx      # Mathematical score breakdown component with itemized contributions
│   │   ├── RiskContribution.jsx   # Reusable point contribution pill badge (+X pts)
│   │   ├── RiskScore.jsx          # Circular & numeric risk score visualizer
│   │   ├── ThreatIntelCard.jsx    # URL, Domain, and IP reputation lookup card
│   │   └── WhyThisScore.jsx       # Primary explainability panel: category budget, evidence flow banner, itemized cards
│   │
│   ├── Dashboard/
│   │   ├── AnalysisHistory.jsx    # Chronological history list of prior scans
│   │   ├── ArtifactsIntelView.jsx # Dedicated threat intelligence lookups view
│   │   ├── DashboardView.jsx      # SOC overview: KPI cards, recent investigations, threat breakdown
│   │   ├── Header.jsx             # Dashboard header with search
│   │   ├── InvestigationsListView.jsx # Searchable, filterable case registry table
│   │   ├── SettingsView.jsx       # System configuration, weights breakdown, engine docs
│   │   └── StatsCard.jsx          # Metric cards (Malicious, Suspicious, Benign, Avg Score)
│   │
│   ├── EmailAnalyzer/
│   │   ├── AnalyzeButton.jsx      # Primary submit button with loading state
│   │   ├── AuthenticationResults.jsx # Deep authentication drilldown table
│   │   ├── EmailFileUpload.jsx    # Drag-and-drop .eml file uploader with validation
│   │   ├── EmailInput.jsx         # Dual-mode ingress (Paste text & Upload .eml) with multi-vector extraction
│   │   ├── EmailPreview.jsx       # Metadata & body preview for uploaded .eml files
│   │   ├── EmlUploader.jsx        # Lightweight fallback upload component
│   │   └── SampleEmails.jsx       # 4 controlled demo scenarios (Legitimate, Suspicious, Phishing, Malicious Infra)
│   │
│   ├── Investigation/
│   │   ├── EvidenceGraph.jsx      # Directed relational graph mapping email -> senders -> domains -> URLs -> IPs
│   │   ├── EvidenceTimeline.jsx   # Chronological vertical timeline of transmission and analysis events
│   │   └── InvestigationSummary.jsx # Dense executive briefing card with artifact counts
│   │
│   ├── Navigation/
│   │   ├── Sidebar.jsx            # Persistent left sidebar navigation drawer
│   │   └── TopNavbar.jsx          # Persistent top navbar with live threat counters & AI quota tag
│   │
│   └── Reports/
│       ├── ExportControls.jsx     # Fast export triggers (JSON download, PDF generation)
│       └── ForensicReport.jsx     # Printable compliance report briefing document
│
├── data/
│   └── demoEmails.js              # Controlled demo email templates for live demonstration
│
├── lib/
│   ├── caseStorage.js             # LocalStorage case persistence (save, fetch, seed default demo cases)
│   ├── emailArtifacts.js          # URL normalization, IP extraction from Received headers, domain structure parser
│   ├── emailAuth.js               # SPF, DKIM, DMARC, ARC, and sender domain consistency checks
│   ├── emailParser.js             # Server-side RFC 5322 parsing integrating auth, artifacts, and threat intel
│   ├── emlParser.js               # Pure-JS RFC 5322 parser for client-side execution
│   ├── evidenceGraph.js           # Builds node/edge relational graph from investigation data
│   ├── evidenceTimeline.js        # Builds chronological event timeline from metadata and headers
│   ├── exportSanitizer.js         # Secret scanner and sanitizer stripping API keys from exports
│   ├── gemini.js                  # Gemini Flash API integration with token control and local heuristic fallback
│   ├── investigation.js           # Factory function creating normalized investigation models
│   ├── investigationSnapshot.js   # Single source of truth snapshot builder for exports & reports
│   ├── quota.js                   # Client-side 12-hour rolling quota limiter (demo reset enabled)
│   ├── reportGenerator.js         # Client-side JSON download and jsPDF vector PDF compiler
│   ├── riskEngine.js              # Deterministic unified risk engine implementing the Evidence Chain
│   ├── utils.js                   # UI styling helper functions (clsx / tailwind-merge)
│   └── threatIntel/
│       ├── index.js               # Threat intelligence orchestrator with parallel lookups and deduplication
│       ├── urlIntel.js            # URLhaus and local URL heuristic reputation checker
│       ├── ipIntel.js             # AbuseIPDB and transmission relay IP reputation checker
│       └── domainIntel.js         # Domain structure and suspicious TLD reputation checker
│
├── scripts/
│   └── test_evidence_chain.mjs    # Automated 10-scenario verification suite
│
├── AGENTS.md                      # Agent rules & constraints
├── package.json                   # Project dependencies and npm scripts
└── PROJECT_DOCUMENTATION.md       # Master project documentation (THIS FILE)
```

---

## 4. Deterministic Risk Engine & Scoring Methodology

The core risk engine in `lib/riskEngine.js` is **100% deterministic, local, synchronous, and explainable**.  
Gemini AI does **NOT** decide the final numeric risk score. The final score is computed by aggregating independent evidence sources across 4 strict category budgets:

### Category Budget Allocation (Total: 100 Points)

| Category | Maximum Budget | Signal Sources | Points Rules |
|---|---|---|---|
| **1. AI Content Analysis** | **30 pts** | Gemini 2.5 Flash / Local Heuristic Engine | Critical: +14 pts<br>High: +10 pts<br>Medium: +6 pts<br>Low: +3 pts |
| **2. Email Authentication** | **25 pts** | SPF, DKIM, DMARC headers | DMARC fail: +10 pts (softfail: +5)<br>SPF fail: +8 pts (softfail: +4)<br>DKIM fail: +8 pts |
| **3. Identity & Consistency** | **15 pts** | Sender domain alignment | Reply-To mismatch: +6 pts<br>DKIM domain mismatch: +5 pts<br>SPF domain mismatch: +4 pts<br>Return-Path mismatch: +3 pts |
| **4. Threat Intel & Artifacts** | **30 pts** | URLhaus, AbuseIPDB, Domain Intel, URL Heuristics | Malicious URL: +20 pts (suspicious: +10)<br>Malicious Domain: +15 pts (suspicious: +8)<br>Malicious IP: +15 pts (suspicious: +8)<br>IP Hostname: +12 pts<br>Userinfo in URL: +10 pts<br>Punycode: +8 pts<br>Non-standard Port: +5 pts<br>Deep Subdomains: +4 pts<br>Insecure HTTP: +3 pts |

### Scale-to-Cap Algorithm (`scaleItemsToCap`)
If raw accumulated evidence points within any category exceed its maximum budget, contributions are **proportionally scaled down** so that:
$$\sum_{i} \text{item.riskContribution} \equiv \text{categoryScore} \le \text{CATEGORY\_CAP}$$
And across all categories:
$$\sum_{all} \text{item.riskContribution} \equiv \text{riskScore} \in [0, 100]$$

### Score-to-Risk Level Mapping
- **0–24**: `low` $\longrightarrow$ Verdict: `LOW / LEGITIMATE`
- **25–49**: `medium` $\longrightarrow$ Verdict: `MEDIUM / CAUTION`
- **50–74**: `high` $\longrightarrow$ Verdict: `HIGH / SUSPICIOUS`
- **75–100**: `critical` $\longrightarrow$ Verdict: `CRITICAL / PHISHING` or `CRITICAL / FRAUDULENT`

---

## 5. Feature #1: Evidence Chain & Explainability

### The Traceability Chain
Instead of opaque scoring, every analysis constructs an **Evidence Chain**:
1. **Email Ingress**: Raw RFC 5322 header and body.
2. **Observed Evidence**: The verbatim string discovered (e.g. `dmarc=fail (p=reject domain=paypal.com)`, `From: support@vendor.com\nReply-To: external@phish.net`, or exact body quote `Verify my account`).
3. **Artifact / Signal**: The specific domain, URL, or IP artifact extracted.
4. **Deterministic Analysis**: The exact security rule or threat intel feed that flagged the signal.
5. **Risk Contribution**: The exact points added (`+20 pts`, `+10 pts`, `+6 pts`) towards the 100-point total.
6. **Final Verdict**: Transparent classification backed by the itemized chain.
7. **Actionable Guidance**: Targeted containment steps based on the highest-severity evidence found.

### Stable Evidence Identifiers
Every evidence item is assigned a **stable, sequential identifier**:
- `EV-001`, `EV-002`, `EV-003`, ...
- Items are sorted deterministically by `riskContribution` descending so `EV-001` is always the primary driver of risk.

---

## 6. Data Models & Type Definitions

### EvidenceItem Interface
```typescript
interface EvidenceItem {
  id: string;                  // Stable ID: "EV-001", "EV-002", etc.
  category: "ai" | "authentication" | "identity" | "threat-intelligence";
  type: string;                // "dmarc_fail", "reply_to_mismatch", "malicious_url", etc.
  source: string;              // "email_header", "URLhaus", "AbuseIPDB", "AI Content Analysis"
  evidence: string;            // Verbatim observed evidence string
  artifact: string | null;     // Extracted artifact (domain, URL, IP) or null
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;          // 0.00 to 1.00 decimal certainty
  riskContribution: number;    // Points added to final score
  explanation: string;         // Plain-English forensic explanation
  
  // Backward-compatibility aliases:
  finding: string;             // Alias to explanation
  contribution: number;        // Alias to riskContribution
}
```

### AnalysisResult Interface
```typescript
interface AnalysisResult {
  verdict: "CRITICAL / PHISHING" | "HIGH / SUSPICIOUS" | "MEDIUM / CAUTION" | "LOW / LEGITIMATE";
  classification: "legitimate" | "suspicious" | "fraudulent";
  riskScore: number;           // 0 to 100
  riskLevel: "low" | "medium" | "high" | "critical";
  confidence: number;          // 0 to 100

  categoryScores: {
    aiContent: number;         // 0 to 30 (alias: ai)
    authentication: number;    // 0 to 25
    identity: number;          // 0 to 15 (alias: senderConsistency)
    threatIntelligence: number;// 0 to 30 (alias: threatIntel)
  };

  evidence: EvidenceItem[];    // Normalized evidence chain
  breakdown: EvidenceItem[];   // Backward-compatibility alias

  indicators: Array<{          // AI indicators
    type: string;
    severity: string;
    description: string;
    evidence: string;
    confidence: number;
  }>;

  summary: string;
  recommendation: string;
  authentication: { spf: object; dkim: object; dmarc: object };
  identity: { fromDomain: string; replyToDomain: string; ... };
  consistency: { replyToMismatch: boolean; ... };
  threatIntel: { urls: object[]; domains: object[]; ips: object[] };
  artifacts: { urls: object[]; ips: object[]; domains: object[] };
  metadata: { from: string; to: string; subject: string; date: string; ... };
  body: { text: string };
  urls: string[];
  attachments: object[];
}
```

---

## 7. Email Ingress & Analysis Pipeline

### Dual Ingress Methods
1. **Upload .eml File**: File is validated (<= 5 MB), sent to `/api/parse-eml` which parses RFC 5322 structure, extracts headers, URLs, IPs, domains, and queries threat intelligence feeds.
2. **Paste Plain-Text / Raw Headers**: Text is ingested in the editor. On submission, if not already parsed, `EmailInput.jsx` executes `/api/parse-eml` so that pasted headers, sender mismatches, and URLs are evaluated with the same multi-vector rigor as uploaded files.

### Analysis Execution Flow
```
User Submits Email (Text or .eml)
  │
  ├─► Server /api/parse-eml
  │     ├─ simpleParser extracts From, Reply-To, Subject, Body, Attachments
  │     ├─ extractAndNormalizeUrls extracts and normalizes URLs
  │     ├─ extractIpsFromReceivedHeaders extracts mail relay chain
  │     ├─ analyzeEmailAuthentication evaluates SPF, DKIM, DMARC, Domain Alignment
  │     └─ investigateArtifacts queries URLhaus, AbuseIPDB, Domain Intel
  │
  ├─► Server /api/analyze
  │     └─ analyzeEmail calls Gemini 2.5 Flash (or deterministic heuristic fallback)
  │
  └─► Client calculateUnifiedRisk
        ├─ evaluateAiEvidence (Cap: 30)
        ├─ evaluateAuthenticationEvidence (Cap: 25)
        ├─ evaluateIdentityEvidence (Cap: 15)
        ├─ evaluateThreatIntelEvidence (Cap: 30)
        ├─ scaleItemsToCap (Guarantees sum = category cap)
        ├─ Assign Stable IDs: EV-001, EV-002, ...
        ├─ Compute Verdict and Confidence
        ├─ saveCaseToStorage (Persists into localStorage)
        └─ Render AnalysisResult (WhyThisScore, EvidenceList, Graph, Timeline)
```

---

## 8. Threat Intelligence & Header Forensics Engine

- **URL Intelligence** (`lib/threatIntel/urlIntel.js`): Checks URLs against URLhaus database format and evaluates structural risk heuristics (IP hostname, userinfo credentials, punycode spoofing, non-standard ports, deep subdomains, insecure HTTP).
- **IP Intelligence** (`lib/threatIntel/ipIntel.js`): Analyzes Received header relay hops, extracts public IP addresses, and checks against AbuseIPDB abuse scoring.
- **Domain Intelligence** (`lib/threatIntel/domainIntel.js`): Parses multi-level domains (e.g. `co.uk`, `com.au`), extracts root domains, and flags suspicious TLDs.
- **Deduplication & Rate Limiting** (`lib/threatIntel/index.js`): Strict cap of 10 lookups per artifact type to prevent quota exhaustion and rate limiting.
- **Fail-Safe Orchestration**: Uses `Promise.allSettled()` to guarantee zero crashes if threat intel lookups fail.

---

## 9. UI Design System & SOC Interface

- **Theme**: Dark Cybersecurity SOC Console (`#09090B` deep background, `#111113` cards, `#18181B` secondary, `#27272A` borders, `#F4F4F5` foreground).
- **Typography**: Inter / Outfit modern sans for UI, JetBrains Mono / Geist Mono for artifacts, headers, evidence snippets, and scores.
- **Key Views**:
  1. **Dashboard View**: High-level SOC metrics, recent investigations table, threat distribution breakdown.
  2. **New Investigation View**: Dual-mode ingress with 4 one-click demo scenario cards.
  3. **Case Detail Inspector (`AnalysisResult.jsx`)**: 8 dense tabs:
     - *Overview*: Threat Hero, `WhyThisScore` Evidence Chain, Executive Summary, `EvidenceList`.
     - *Email Content*: RFC 5322 Header grid and safe plain-text body viewer.
     - *Authentication*: SPF, DKIM, DMARC, ARC and relay hop chain.
     - *Artifacts*: Extracted URLs, domains, IPs, and attachment metadata.
     - *Threat Intel*: Reputation findings from URLhaus and AbuseIPDB.
     - *Timeline*: Chronological vertical sequence of transmission and detection events.
     - *Evidence Graph*: Directed relational node-edge graph.
     - *Forensic Report*: Printable briefing document with JSON and PDF export controls.
  4. **Investigations Registry**: Searchable, filterable historical case table.
  5. **Threat Intel Lookup**: Standalone artifact analysis tool.
  6. **Settings & Methodology**: Budget explanations, engine documentation.

---

## 10. Security, Privacy & Anti-Hallucination Guarantees

1. **Anti-Hallucination Mandate**:
   - The engine never invents IOCs, domains, IPs, authentication results, or evidence quotes.
   - If an artifact was not observed in the email, it is never included in the evidence chain.
   - If a signal is unavailable, it is marked as `not_available` or `unavailable` and contributes 0 risk points.
2. **Untrusted Input Sanitization**:
   - Raw email bodies are never rendered using `dangerouslySetInnerHTML`.
   - Text is stripped of executable HTML/JS tags and rendered inside safe `<pre className="whitespace-pre-wrap">` elements.
3. **Export Secret Scanning**:
   - `lib/exportSanitizer.js` scans every exported JSON or PDF dossier.
   - Zero API keys (`GEMINI_API_KEY`, VirusTotal, AbuseIPDB), session cookies, or environment variables are ever included in client exports.
4. **Privacy-Preserving Local Storage**:
   - Cases are stored locally in the analyst's browser `localStorage`.
   - Historical case reviews execute with zero additional Gemini API calls.

---

## 11. Testing & Verification Suite

The platform includes an automated verification script: `scripts/test_evidence_chain.mjs`.  
It tests **10 mandatory scenarios**:

| Test | Scenario | Verified Output |
|---|---|---|
| **A** | Legitimate Business Email | Score $\le 24$ (Low), `LOW / LEGITIMATE`, zero malicious evidence points. |
| **B** | Phishing Email (Credential Harvesting) | Elevated score ($33/100$), AI Content $30/30$, `EV-001` assigned, points sum strictly equals score. |
| **C** | BEC / Financial Wire Redirection | AI Content flags wire fraud pattern with exact quoted text snippet. |
| **D** | Suspicious Email with Mild Anomalies | Evaluated safely without phantom findings. |
| **E** | Email with DMARC Failure | Authentication $+10$ pts, `EV-001`, `dmarc_fail`, observed `dmarc=fail (p=reject domain=...)`. |
| **F** | Email with Reply-To Mismatch | Identity $+6$ pts, `reply_to_mismatch`, artifact `external-phish.net`, observed `From` and `Reply-To`. |
| **G** | Email with Malicious URL | Threat Intel $+20$ pts, `malicious_url`, severity `critical`, source `URLhaus`, actual URL observed. |
| **H** | Clean Email with No Threat Intel Hits | Threat Intel $0$ pts, zero false-positive evidence generated. |
| **I** | AI Service Failure / Fallback Heuristic | Deterministic heuristic engine engages seamlessly with 0 crashes, extracts evidence snippets, returns valid score. |
| **J** | Malformed Email Input | Handled unstructured text without crashing, points sum equals score. |
| **K** | Snapshot & Export Sanitization Integrity | Verified that `EV-xxx` evidence items pass through snapshot generation and export sanitization intact. |

---

## 12. How to Run, Test, and Build

```bash
# 1. Run the automated Evidence Chain test suite (47 assertions):
node scripts/test_evidence_chain.mjs

# 2. Build production Next.js bundle (verifies zero compile errors):
cmd /c npm run build

# 3. Start the local development server:
npm run dev

# 4. Open the application:
# http://localhost:3000
```

---

## 13. Project Changelog

| Date | Author / Agent | Changes Made |
|---|---|---|
| **2026-09-08** | Antigravity AI | **Implemented Feature #1: Evidence Chain & Explainability Platform**<br>• Updated `lib/riskEngine.js` with normalized `evidence` array, stable IDs (`EV-001`, `EV-002`), real observed snippets, severity, confidence, risk contributions, category budgets, and human-readable `verdict`.<br>• Updated `lib/emailAuth.js` to preserve raw `from`, `replyTo`, `returnPath` strings in identity.<br>• Updated `EmailInput.jsx` to parse pasted emails via `/api/parse-eml` for multi-vector parity.<br>• Built new UI components: `WhyThisScore.jsx`, `RiskContribution.jsx`, `EvidenceCategory.jsx`.<br>• Enhanced `EvidenceCard.jsx`, `EvidenceList.jsx`, and `RiskBreakdown.jsx`.<br>• Integrated `WhyThisScore` and explicit `verdict` badge in `AnalysisResult.jsx`.<br>• Preserved complete evidence chain in `investigationSnapshot.js`, `exportSanitizer.js`, and `caseStorage.js`.<br>• Created automated verification suite `scripts/test_evidence_chain.mjs` (47/47 checks passed).<br>• Verified production build compiles successfully with Turbopack (0 errors). |
