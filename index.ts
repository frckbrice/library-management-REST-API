import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import dbPool from "./config/database/db";
import { registerRoutes } from "./server/routes";
import { Pool as NeonPool } from "@neondatabase/serverless";
import { Pool } from "pg";
import errorHandler from "./middlewares/errors/error-handler";
import cors from 'cors';
import { MemStorage } from "./config/database/storage";

import corsOptions from "./config/cors/cors-options";

// Declare session data
declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
      username: string;
      fullName: string;
      email: string;
      role: string;
      libraryId?: string;
    };
  }
}

const PORT = process.env.PORT || 5500;;

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
  store: process.env.DATAAPI_URL
    ? new PgStore({
      pool,
      tableName: 'session',
      createTableIfMissing: true
    })
    : new MemoryStoreSession({
      checkPeriod: 86400000 // every 24h
    }),
  secret: process.env.SESSION_SECRET || 'library_connect_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

// Main async block
(async () => {
  const server = await registerRoutes("/api/v1", app);

  // Error handler
  app.use(errorHandler);

  // Start server
  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  }).on("error", () => {
    console.error("Error starting server");
  });
})();
