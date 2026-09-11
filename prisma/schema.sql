-- Generated Prisma Migration for Email Forensics Platform
-- Compatible with Supabase PostgreSQL (run in Supabase SQL Editor if desired)

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CaseClassification" AS ENUM ('LEGITIMATE', 'SUSPICIOUS', 'FRAUDULENT');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('NEW', 'INVESTIGATING', 'REVIEWED', 'ESCALATED', 'RESOLVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ArtifactType" AS ENUM ('URL', 'DOMAIN', 'IP', 'ATTACHMENT');

-- CreateEnum
CREATE TYPE "ThreatResult" AS ENUM ('CLEAN', 'SUSPICIOUS', 'MALICIOUS', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "EvidenceCategory" AS ENUM ('AI_CONTENT', 'AUTHENTICATION', 'IDENTITY', 'THREAT_INTELLIGENCE');

-- CreateEnum
CREATE TYPE "EvidenceSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "userId" TEXT,
    "classification" "CaseClassification" NOT NULL DEFAULT 'SUSPICIOUS',
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "CaseStatus" NOT NULL DEFAULT 'NEW',
    "verdict" TEXT,
    "subject" TEXT,
    "sender" TEXT,
    "recipient" TEXT,
    "categoryScores" JSONB,
    "aiSummary" TEXT,
    "aiRecommendation" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emails" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "from" TEXT,
    "to" TEXT,
    "cc" TEXT,
    "bcc" TEXT,
    "replyTo" TEXT,
    "returnPath" TEXT,
    "subject" TEXT,
    "date" TEXT,
    "messageId" TEXT,
    "inReplyTo" TEXT,
    "references" TEXT,
    "bodyText" TEXT,
    "rawHeaders" JSONB,
    "attachments" JSONB,
    "authentication" JSONB,
    "identity" JSONB,
    "consistency" JSONB,
    "receivedHeaders" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artifacts" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "emailId" TEXT,
    "type" "ArtifactType" NOT NULL,
    "value" TEXT NOT NULL,
    "normalizedValue" TEXT,
    "reputation" TEXT,
    "reputationSource" TEXT,
    "confidence" DOUBLE PRECISION,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "threat_intelligence_results" (
    "id" TEXT NOT NULL,
    "artifactId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "result" "ThreatResult" NOT NULL DEFAULT 'UNKNOWN',
    "reputation" TEXT,
    "confidence" DOUBLE PRECISION,
    "rawResult" JSONB,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "threat_intelligence_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT,
    "caseId" TEXT NOT NULL,
    "artifactId" TEXT,
    "category" "EvidenceCategory" NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "severity" "EvidenceSeverity" NOT NULL DEFAULT 'MEDIUM',
    "confidence" DOUBLE PRECISION,
    "riskContribution" INTEGER NOT NULL DEFAULT 0,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investigation_events" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT,
    "severity" TEXT,
    "eventTimestamp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investigation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyst_notes" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "userId" TEXT,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analyst_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cases_caseNumber_key" ON "cases"("caseNumber");

-- CreateIndex
CREATE INDEX "cases_userId_idx" ON "cases"("userId");

-- CreateIndex
CREATE INDEX "cases_caseNumber_idx" ON "cases"("caseNumber");

-- CreateIndex
CREATE INDEX "cases_classification_idx" ON "cases"("classification");

-- CreateIndex
CREATE INDEX "cases_riskLevel_idx" ON "cases"("riskLevel");

-- CreateIndex
CREATE INDEX "cases_status_idx" ON "cases"("status");

-- CreateIndex
CREATE INDEX "cases_createdAt_idx" ON "cases"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "emails_caseId_key" ON "emails"("caseId");

-- CreateIndex
CREATE INDEX "emails_caseId_idx" ON "emails"("caseId");

-- CreateIndex
CREATE INDEX "artifacts_caseId_idx" ON "artifacts"("caseId");

-- CreateIndex
CREATE INDEX "artifacts_emailId_idx" ON "artifacts"("emailId");

-- CreateIndex
CREATE INDEX "artifacts_type_idx" ON "artifacts"("type");

-- CreateIndex
CREATE INDEX "threat_intelligence_results_artifactId_idx" ON "threat_intelligence_results"("artifactId");

-- CreateIndex
CREATE INDEX "evidence_caseId_idx" ON "evidence"("caseId");

-- CreateIndex
CREATE INDEX "evidence_artifactId_idx" ON "evidence"("artifactId");

-- CreateIndex
CREATE INDEX "evidence_category_idx" ON "evidence"("category");

-- CreateIndex
CREATE INDEX "investigation_events_caseId_idx" ON "investigation_events"("caseId");

-- CreateIndex
CREATE INDEX "investigation_events_createdAt_idx" ON "investigation_events"("createdAt");

-- CreateIndex
CREATE INDEX "analyst_notes_caseId_idx" ON "analyst_notes"("caseId");

-- CreateIndex
CREATE INDEX "analyst_notes_userId_idx" ON "analyst_notes"("userId");

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emails" ADD CONSTRAINT "emails_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "emails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "threat_intelligence_results" ADD CONSTRAINT "threat_intelligence_results_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "artifacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "artifacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigation_events" ADD CONSTRAINT "investigation_events_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyst_notes" ADD CONSTRAINT "analyst_notes_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyst_notes" ADD CONSTRAINT "analyst_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_clerkUserId_key" ON "users"("clerkUserId");
CREATE INDEX "users_clerkUserId_idx" ON "users"("clerkUserId");

