/**
 * Database Connection & Drizzle ORM
 *
 * Chooses PostgreSQL (node-postgres) for local/development and Neon serverless
 * for production. Exports { pool, db } for use by services and session store.
 * Requires DATABASE_PRO_URL in the environment.
 *
 * @module config/database/db
 */

import * as schema from "./schema";
import dotenv from 'dotenv';
import ws from "ws";
import { Pool as PgPool } from 'pg';
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-serverless';

dotenv.config();

if (!process.env.DATABASE_PRO_URL && !process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_PRO_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.DATABASE_PRO_URL || process.env.DATABASE_URL;
const isNeon = connectionString?.includes('neon.tech') || connectionString?.includes('neon.azure');
const isLocal = connectionString?.includes('localhost');

let pool: PgPool | NeonPool;
let db: ReturnType<typeof pgDrizzle> | ReturnType<typeof neonDrizzle>;

if (isNeon || !isLocal) {
  // Use Neon driver for Neon URLs or any non-local DB (e.g. production or dev against cloud)
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString, ssl: true });
  db = neonDrizzle(pool, { schema });
} else {
  pool = new PgPool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: true,
  });
  db = pgDrizzle(pool as PgPool, { schema });
}

export default { pool, db };
