import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

console.log("=== SUPABASE DATABASE CONTENTS ===");
const cases = await client.query('SELECT id, "caseNumber", subject, "riskScore", classification, "createdAt" FROM cases;');
console.log(`Cases count: ${cases.rows.length}`);
console.log("Cases:", cases.rows);

const emails = await client.query('SELECT id, "caseId", "from", subject FROM emails;');
console.log(`Emails count: ${emails.rows.length}`);
console.log("Emails:", emails.rows);

const artifacts = await client.query('SELECT id, "caseId", type, value FROM artifacts;');
console.log(`Artifacts count: ${artifacts.rows.length}`);
console.log("Artifacts:", artifacts.rows);

const evidence = await client.query('SELECT id, "caseId", "evidenceId", category, type, severity, "riskContribution" FROM evidence;');
console.log(`Evidence count: ${evidence.rows.length}`);
console.log("Evidence:", evidence.rows);

const events = await client.query('SELECT id, "caseId", "eventType", title FROM investigation_events;');
console.log(`Events count: ${events.rows.length}`);
console.log("Events:", events.rows);

const ti = await client.query('SELECT t.id, t."artifactId", t.provider, t.result, a.value, a."caseId" FROM threat_intelligence_results t JOIN artifacts a ON t."artifactId" = a.id;');
console.log(`Threat Intel count: ${ti.rows.length}`);
console.log("Threat Intel:", ti.rows);

client.release();
await pool.end();
