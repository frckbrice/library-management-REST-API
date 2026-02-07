/**
 * API Route Registration
 *
 * Mounts all feature routes under a global path, applies JSON API and rate-limit
 * middlewares, and returns the HTTP server instance. Rate limits are applied
 * per-route type (auth, admin, public, search, etc.).
 *
 * @module src/routes/index
 */

import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerAuthRoutes } from "./auth.routes";
import { registerStoriesRoutes } from "./stories.routes";
import { registerLibrariesRoutes } from "./libraries.routes";
import { registerMediaRoutes } from "./media.routes";
import { registerEventsRoutes } from "./events.routes";
import { registerAdminRoutes } from "./admin.routes";
import { registerSuperAdminRoutes } from "./superadmin.routes";
import { registerContactRoutes } from "./contact.routes";
import { registerMaintenanceRoutes } from "./maintenance.routes";
import { registerSettingsRoutes } from "./settings.routes";
import {
    generalApiLimiter,
    authLimiter,
    contactLimiter,
    uploadLimiter,
    adminLimiter,
    publicLimiter,
    emailLimiter,
    searchLimiter
} from '../middlewares/rate-limiters';
import { jsonApiMiddleware } from "./shared";

/**
 * Registers all API routes and rate limiters, then creates the HTTP server.
 *
 * @param global_path - Base path for all API routes (e.g. "/api/v1")
 * @param app - Express application instance
 * @returns HTTP server (not yet listening)
 */
export async function registerRoutes(global_path: string, app: Express): Promise<Server> {
    app.use(global_path, jsonApiMiddleware);
    app.use(global_path, generalApiLimiter);

    app.use(global_path + '/libraries', publicLimiter);
    app.use(global_path + '/stories', publicLimiter);
    app.use(global_path + '/events', publicLimiter);
    app.use(global_path + '/media-items', publicLimiter);

    // Apply stricter rate limiting to admin routes
    app.use(global_path + '/admin', adminLimiter);

    // Apply search rate limiting to search endpoints
    app.get(global_path + '/libraries', (req, res, next) => {
        if (req.query.search) {
            return searchLimiter(req, res, next);
        }
        next();
    });

    app.get(global_path + '/stories', (req, res, next) => {
        if (req.query.search) {
            return searchLimiter(req, res, next);
        }
        next();
    });

    // Register all route modules
    registerAuthRoutes(app, global_path);
    registerStoriesRoutes(app, global_path);
    registerLibrariesRoutes(app, global_path);
    registerMediaRoutes(app, global_path);
    registerEventsRoutes(app, global_path);
    registerAdminRoutes(app, global_path);
    registerSuperAdminRoutes(app, global_path);
    registerContactRoutes(app, global_path);
    registerMaintenanceRoutes(app, global_path);
    registerSettingsRoutes(app, global_path);

    const httpServer = createServer(app);
    return httpServer;
}
