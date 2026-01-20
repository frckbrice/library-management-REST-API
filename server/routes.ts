import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import {
  generalApiLimiter,
  adminLimiter,
  publicLimiter,
  searchLimiter
} from '../middlewares/rate-limiters';
import { jsonApiMiddleware } from '../src/routes/shared';
import { registerAllRoutes } from '../src/routes';

export async function registerRoutes(global_path: string, app: Express): Promise<Server> {
  // Apply JSON API middleware to all API routes
  app.use(global_path, jsonApiMiddleware);
  app.use(global_path, generalApiLimiter);

  app.use(global_path + '/libraries', publicLimiter);
  app.use(global_path + '/stories', publicLimiter);
  app.use(global_path + '/events', publicLimiter);
  app.use(global_path + '/media-items', publicLimiter);

  // Apply stricter rate limiting to admin routes
  app.use(global_path + '/admin', adminLimiter);

  // Apply search rate limiting to search endpoints
  app.get('/api/libraries', (req, res, next) => {
    if (req.query.search) {
      return searchLimiter(req, res, next);
    }
    next();
  });

  app.get('/api/stories', (req, res, next) => {
    if (req.query.search) {
      return searchLimiter(req, res, next);
    }
    next();
  });

  // Register all organized routes
  registerAllRoutes(app, global_path);

  const httpServer = createServer(app);

  return httpServer;
}
