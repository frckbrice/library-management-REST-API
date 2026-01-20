import express from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import dbPool from "./config/database/db";
import { registerRoutes } from "./server/routes";
import { Pool as NeonPool } from "@neondatabase/serverless";
import { Pool } from "pg";
import errorHandler from "./middlewares/errors/error-handler";
import logger from "./middlewares/logger";
import cors from 'cors';
import { env } from "./src/config/env";
import corsOptions from "./config/cors/cors-options";

// Setup session stores
const MemoryStoreSession = MemoryStore(session);
const PgStore = connectPgSimple(session);
const pool: any | Pool | NeonPool = dbPool.pool;

// Create express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// cors
app.use(cors(corsOptions));

// Session middleware
app.use(session({
  store: env.DATAAPI_URL
    ? new PgStore({
      pool,
      tableName: 'session',
      createTableIfMissing: true
    })
    : new MemoryStoreSession({
      checkPeriod: 86400000 // every 24h
    }),
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Request logging middleware
app.use(logger);

// Main async block
(async () => {
  const server = await registerRoutes("/api/v1", app);

  // Error handler
  app.use(errorHandler);

  // Start server
  server.listen(env.PORT, () => {
    console.log(`Server running at http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
  }).on("error", (error) => {
    console.error("Error starting server:", error);
    process.exit(1);
  });
})();
