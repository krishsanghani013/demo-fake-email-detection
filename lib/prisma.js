import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

let prismaInstance = null;

export function isDatabaseConfigured() {
  const url = process.env.DATABASE_URL || "";
  return Boolean(
    url &&
    !url.includes("[YOUR-PASSWORD]") &&
    !url.includes("your-password") &&
    url.startsWith("postgres")
  );
}

function createPrismaClient() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString || connectionString.includes("[YOUR-PASSWORD]")) {
    // Return null or placeholder if connection string is incomplete
    return null;
  }

  try {
    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  } catch (err) {
    console.error("Failed to initialize Prisma client with adapter-pg:", err.message);
    return null;
  }
}

if (process.env.NODE_ENV === "production") {
  prismaInstance = createPrismaClient();
} else {
  if (!globalThis.prisma) {
    globalThis.prisma = createPrismaClient();
  }
  prismaInstance = globalThis.prisma;
}

export const db = prismaInstance;
export default db;
