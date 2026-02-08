/**
 * Library Management API - Application Entry Point
 *
 * Bootstraps the Express server with session management (PostgreSQL or in-memory),
 * CORS, JSON body parsing, request logging, and API routes. The global error
 * handler is registered after routes so all errors are caught and formatted.
 *
 * @module index
 */

import express from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import dbPool from "./config/database/db";
import { registerRoutes } from "./src/routes";
import { Pool as NeonPool } from "@neondatabase/serverless";
import { Pool } from "pg";
import errorHandler from "./src/middlewares/error-handler";
import { requestLogger } from "./src/middlewares/logger";
import helmet from "helmet";
import cors from "cors";
import { env } from "./src/config/env";
import corsOptions from "./config/cors/cors-options";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./config/swagger";

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
app.use(requestLogger);

/** Static files and landing page: GET / serves public/index.html */
app.use(express.static("public"));

(async () => {
  const server = await registerRoutes("/api/v1", app);
  app.use(errorHandler);

  server.listen(env.PORT, () => {
    console.log(`Server running at http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
  }).on("error", (error) => {
    console.error("Error starting server:", error);
    process.exit(1);
  });
})();
