/**
 * Library Management API - Application Entry Point
 *
 * Bootstraps the Express server with session management (PostgreSQL or in-memory),
 * CORS, JSON body parsing, request logging, and API routes. The global error
 * handler is registered after routes so all errors are caught and formatted.
 *
 * @module index
 */

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import dbPool from "./config/database/db";
import { registerRoutes } from "./src/routes";
import { Pool as NeonPool } from "@neondatabase/serverless";
import { Pool } from "pg";
import errorHandler from "./src/middlewares/error-handler";
import helmet from "helmet";
import cors from "cors";
import { MemStorage } from "./config/database/storage";

import corsOptions from "./config/cors/cors-options";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./config/swagger";

/** Extend express-session with app-specific session payload */
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

const PORT = process.env.PORT || 5500;

// Setup session stores
const MemoryStoreSession = MemoryStore(session);
const PgStore = connectPgSimple(session);
const pool: any | Pool | NeonPool = dbPool.pool;

const app = express();

/** OpenAPI docs (Swagger UI) – interact with the API at GET /api-docs */
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: "Library Management API - Documentation",
    swaggerOptions: {
      displayRequestDuration: true,
      docExpansion: "list",
      filter: true,
      showExtensions: true,
      persistAuthorization: true,
    },
  })
);

/** Security headers (X-Content-Type-Options, X-Frame-Options, etc.) */
app.use(helmet({ contentSecurityPolicy: false })); // Disable CSP for API-only backend

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors(corsOptions));

/** Session middleware: persistent in production (PgStore), in-memory otherwise */
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

(async () => {
  const server = await registerRoutes("/api/v1", app);
  app.use(errorHandler);

  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  }).on("error", () => {
    console.error("Error starting server");
  });
})();
