/**
 * apply-schema.ts
 *
 * Use this instead of `prisma db push` or `prisma migrate deploy` when port 5432
 * (TCP) is blocked on your network (e.g. ISP firewall). Connects via Neon's
 * WebSocket driver which uses HTTP/WS and bypasses the TCP block.
 *
 * Usage:
 *   1. Generate the SQL diff (no DB connection needed):
 *        npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script -o prisma/current-schema.sql
 *   2. Run this script:
 *        npx tsx scripts/apply-schema.ts
 */

import { config } from "dotenv";
import { readFileSync } from "fs";
import { resolve } from "path";
import { Pool } from "@neondatabase/serverless";

config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const client = await pool.connect();

  try {
    console.log("Dropping existing schema...");
    await client.query("DROP SCHEMA public CASCADE");
    await client.query("CREATE SCHEMA public");
    console.log("Schema dropped and recreated.");

    const migrationSql = readFileSync(resolve("prisma/current-schema.sql"), "utf8");

    // Strip comment lines, then split on semicolons
    const stripped = migrationSql
      .split("\n")
      .filter(line => !line.trimStart().startsWith("--"))
      .join("\n");

    const statements = stripped
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Running ${statements.length} SQL statements...`);
    for (const stmt of statements) {
      await client.query(stmt);
    }

    console.log("Schema applied successfully.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error("Failed:", e.message); process.exit(1); });
