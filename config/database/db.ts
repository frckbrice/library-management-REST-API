import * as schema from "./schema";
import dotenv from 'dotenv';
import ws from "ws";
import { Pool as PgPool } from 'pg'; // Local PostgreSQL
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless'; // Neon
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-serverless';

dotenv.config();

if (!process.env.DATABASE_PRO_URL || !process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isLocal = process.env.DATABASE_URL.includes('localhost') ||
  process.env.NODE_ENV === 'development';

let pool, db;

if (isLocal) {
  // Local PostgreSQL setup
  pool = new PgPool({
    connectionString: process.env.DATABASE_PRO_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: true,
  });
  db = pgDrizzle(pool, { schema });
} else {
  // Neon serverless setup
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString: process.env.DATABASE_PRO_URL, ssl: true });
  db = neonDrizzle(pool, { schema });
}

export default { pool, db };
