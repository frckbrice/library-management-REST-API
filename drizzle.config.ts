import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_PRO_URL) {
  throw new Error("DATABASE_PRO_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./config/database/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_PRO_URL + "?sslmode=require", // add ?sslmode=require for. cloud database.
    // url: process.env.DATABASE_URL, // local db
  }
});
