import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import pg from "pg";

console.log("Testing direct PostgreSQL connection to Supabase...");
console.log("DATABASE_URL configured:", Boolean(process.env.DATABASE_URL));

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing!");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

try {
  const client = await pool.connect();
  console.log("✓ Successfully connected to PostgreSQL via pg.Pool!");
  
  const res = await client.query("SELECT current_database(), current_user, version();");
  console.log("Database info:", res.rows[0]);

  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);
  console.log("Tables in database:", tables.rows.map(r => r.table_name));

  const caseCount = await client.query("SELECT count(*) FROM cases;");
  console.log("Current cases count in Supabase:", caseCount.rows[0].count);

  client.release();
  await pool.end();
  console.log("✓ Connection test complete.");
} catch (err) {
  console.error("✗ Connection failed:", err.message);
  process.exit(1);
}
