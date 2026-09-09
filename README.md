# SIH 2026 — Explainable Email Forensics Platform

An explainable email-forensics and fraud detection platform that analyzes raw RFC 5322 emails and produces transparent, evidence-backed risk verdicts.

> 📖 **Comprehensive Project Documentation:**  
> For complete technical architecture, directory file maps, scoring methodology, evidence models, UI components, and maintenance guidelines, refer to **[`PROJECT_DOCUMENTATION.md`](./PROJECT_DOCUMENTATION.md)**.

---

## Quick Start

### 1. Run Automated Test Suite
```bash
node scripts/test_evidence_chain.mjs
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Build Production Bundle
```bash
npm run build
```

---

## Core Principle: Evidence Chain
Every significant risk point is traceable to actual forensic evidence:

$$\text{RAW EMAIL} \longrightarrow \text{OBSERVED EVIDENCE} \longrightarrow \text{ARTIFACT / SIGNAL} \longrightarrow \text{DETERMINISTIC ANALYSIS} \longrightarrow \text{RISK CONTRIBUTION} \longrightarrow \text{FINAL VERDICT}$$

See [`PROJECT_DOCUMENTATION.md`](./PROJECT_DOCUMENTATION.md) for full details.
