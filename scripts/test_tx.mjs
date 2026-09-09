import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { PrismaClient } from "./lib/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

console.log("=== TESTING TRANSACTION ON DATABASE_URL (6543) ===");
const pool1 = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter1 = new PrismaPg(pool1);
const db1 = new PrismaClient({ adapter: adapter1 });

try {
  console.log("Attempting $transaction on port 6543...");
  const res1 = await db1.$transaction(async (tx) => {
    return await tx.case.count();
  }, { timeout: 10000 });
  console.log("✓ Port 6543 $transaction count:", res1);
} catch (err) {
  console.error("✗ Port 6543 failed:", err.message);
} finally {
  await db1.$disconnect();
  await pool1.end();
}

console.log("\n=== TESTING TRANSACTION ON DIRECT_URL (5432) ===");
const pool2 = new pg.Pool({ connectionString: process.env.DIRECT_URL });
const adapter2 = new PrismaPg(pool2);
const db2 = new PrismaClient({ adapter: adapter2 });

try {
  console.log("Attempting $transaction on port 5432...");
  const res2 = await db2.$transaction(async (tx) => {
    return await tx.case.count();
  }, { timeout: 10000 });
  console.log("✓ Port 5432 $transaction count:", res2);
} catch (err) {
  console.error("✗ Port 5432 failed:", err.message);
} finally {
  await db2.$disconnect();
  await pool2.end();
}
