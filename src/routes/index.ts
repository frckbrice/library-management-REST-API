import type { Express } from "express";
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

export function registerAllRoutes(app: Express, global_path: string) {
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
}
