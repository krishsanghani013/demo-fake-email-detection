import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "../lib/prisma.js";

console.log("Testing Prisma Client query...");
console.log("Prisma instance:", Boolean(db));

if (!db) {
  console.error("Prisma client (db) is null!");
  process.exit(1);
}

try {
  const count = await db.case.count();
  console.log("✓ Prisma count successful! Total cases:", count);

  const cases = await db.case.findMany({
    take: 5,
    include: {
      email: true,
      artifacts: true,
      evidence: true,
      investigationEvents: true,
    },
  });
  console.log("✓ Prisma findMany successful! Retrieved:", cases.length);
  if (cases.length > 0) {
    console.log("First case:", {
      id: cases[0].id,
      caseNumber: cases[0].caseNumber,
      subject: cases[0].subject,
      evidenceCount: cases[0].evidence.length,
      artifactsCount: cases[0].artifacts.length,
    });
  }
} catch (err) {
  console.error("✗ Prisma query failed:", err);
  process.exit(1);
} finally {
  await db.$disconnect();
}
