/**
 * One-off: mark the initial migration as already applied in the DB.
 * Use when the DB already has the tables but drizzle.__drizzle_migrations
 * has no record (e.g. tables were created by a previous push or manual run).
 *
 * Run: tsx scripts/mark-migration-applied.ts
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

if (!process.env.DATABASE_PRO_URL) {
  console.error("DATABASE_PRO_URL is required");
  process.exit(1);
}

const drizzleDir = path.join(process.cwd(), "drizzle");
const journalPath = path.join(drizzleDir, "meta", "_journal.json");
const journal = JSON.parse(fs.readFileSync(journalPath, "utf-8"));

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_PRO_URL + "?sslmode=require",
    ssl: true,
  });

  try {
    await pool.query("CREATE SCHEMA IF NOT EXISTS drizzle");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);

    for (const entry of journal.entries) {
      const migrationPath = path.join(drizzleDir, `${entry.tag}.sql`);
      const query = fs.readFileSync(migrationPath, "utf-8");
      const hash = crypto.createHash("sha256").update(query).digest("hex");
      const created_at = entry.when;

      const existing = await pool.query(
        "SELECT 1 FROM drizzle.__drizzle_migrations WHERE created_at = $1",
        [created_at]
      );
      if (existing.rows.length > 0) {
        console.log(`Migration ${entry.tag} (${created_at}) already recorded, skip.`);
        continue;
      }

      await pool.query(
        `INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)`,
        [hash, created_at]
      );
      console.log(`Recorded migration: ${entry.tag} (created_at=${created_at})`);
    }

    console.log("Done. You can run pnpm db:migrate safely now.");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
