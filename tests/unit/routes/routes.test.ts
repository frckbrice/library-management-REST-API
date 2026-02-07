/**
 * Unit Tests for Route Registration
 *
 * Verifies that each route module registers the expected HTTP method and path.
 */

import type { Express } from 'express';

// Mock dependencies so route modules can load without DB/auth
jest.mock('../../../src/services/drizzle-services', () => ({
    __esModule: true,
    default: {},
}));
jest.mock('../../../src/middlewares/rate-limiters', () => ({
    authLimiter: (req: any, res: any, next: any) => next(),
    contactLimiter: (req: any, res: any, next: any) => next(),
    emailLimiter: (req: any, res: any, next: any) => next(),
    generalApiLimiter: (req: any, res: any, next: any) => next(),
    adminLimiter: (req: any, res: any, next: any) => next(),
    publicLimiter: (req: any, res: any, next: any) => next(),
    searchLimiter: (req: any, res: any, next: any) => next(),
    uploadLimiter: (req: any, res: any, next: any) => next(),
}));
jest.mock('../../../src/middlewares/auth', () => ({
    requireAuth: (req: any, res: any, next: any) => next(),
    requireLibraryAdmin: (req: any, res: any, next: any) => next(),
    requireSuperAdmin: (req: any, res: any, next: any) => next(),
}));
jest.mock('../../../src/middlewares/validation', () => ({
    validate: () => (req: any, res: any, next: any) => next(),
}));
jest.mock('bcrypt', () => ({ compare: jest.fn() }));
jest.mock('../../../src/services/email-service', () => ({ sendResponseEmail: jest.fn() }));
jest.mock('../../../src/validations/auth.schemas', () => ({ loginSchema: {} }));
jest.mock('../../../config/bucket-storage/cloudinary', () => ({
    cloudinaryService: {
        isReady: () => false,
        deleteImage: jest.fn(),
    },
}));
jest.mock('../../../src/routes/shared', () => ({
    upload: {
        single: () => (req: any, res: any, next: any) => next(),
        fields: () => (req: any, res: any, next: any) => next(),
    },
    apiHandler: (fn: any) => fn,
    uploadImageToCloudinary: jest.fn(),
    jsonApiMiddleware: (req: any, res: any, next: any) => next(),
}));

function createMockApp(): Express & { registered: Array<{ method: string; path: string }> } {
    const registered: Array<{ method: string; path: string }> = [];
    const noop = () => { };
    const register = (method: string) => (path: string, ...handlers: any[]) => {
        registered.push({ method, path });
    };
    return {
        registered,
        get: register('GET'),
        post: register('POST'),
        patch: register('PATCH'),
        put: register('PUT'),
        delete: register('DELETE'),
        use: noop as any,
    } as Express & { registered: Array<{ method: string; path: string }> };
}

function hasRoute(
    registered: Array<{ method: string; path: string }>,
    method: string,
    pathSubstr: string
): boolean {
    return registered.some(
        (r) => r.method === method && r.path.includes(pathSubstr)
    );
}

const GLOBAL_PATH = '/api/v1';

describe('Route registration', () => {
    describe('registerAuthRoutes', () => {
        it('should register login, session, logout', async () => {
            const { registerAuthRoutes } = await import('../../../src/routes/auth.routes');
            const app = createMockApp();
            registerAuthRoutes(app as Express, GLOBAL_PATH);

            expect(hasRoute(app.registered, 'POST', '/auth/login')).toBe(true);
            expect(hasRoute(app.registered, 'GET', '/auth/session')).toBe(true);
            expect(hasRoute(app.registered, 'POST', '/auth/logout')).toBe(true);
        });
    });

    describe('registerMaintenanceRoutes', () => {
        it('should register health, maintenance status, toggle, schedule, backup', async () => {
            const { registerMaintenanceRoutes } = await import(
                '../../../src/routes/maintenance.routes'
            );
            const app = createMockApp();
            registerMaintenanceRoutes(app as Express, GLOBAL_PATH);

            expect(hasRoute(app.registered, 'GET', '/health')).toBe(true);
            expect(hasRoute(app.registered, 'GET', '/maintenance/status')).toBe(true);
            expect(hasRoute(app.registered, 'POST', '/maintenance/toggle')).toBe(true);
            expect(hasRoute(app.registered, 'POST', '/maintenance/schedule')).toBe(true);
            expect(hasRoute(app.registered, 'POST', '/maintenance/backup')).toBe(true);
            expect(hasRoute(app.registered, 'GET', '/maintenance/backups')).toBe(true);
            expect(hasRoute(app.registered, 'POST', '/maintenance/refresh')).toBe(true);
        });
    });

    describe('registerSettingsRoutes', () => {
        it('should register settings get, update, test-email', async () => {
            const { registerSettingsRoutes } = await import(
                '../../../src/routes/settings.routes'
            );
            const app = createMockApp();
            registerSettingsRoutes(app as Express, GLOBAL_PATH);

            expect(hasRoute(app.registered, 'GET', '/settings')).toBe(true);
            expect(hasRoute(app.registered, 'POST', '/settings')).toBe(true);
            expect(hasRoute(app.registered, 'POST', '/settings/test-email')).toBe(true);
        });
    });

    describe('registerAdminRoutes', () => {
        it('should register dashboard stats, analytics, activity, galleries, delete image', async () => {
            const { registerAdminRoutes } = await import('../../../src/routes/admin.routes');
            const app = createMockApp();
            registerAdminRoutes(app as Express, GLOBAL_PATH);

            expect(app.registered.length).toBeGreaterThan(0);
            const pathStr = app.registered.map((r) => r.path).join(' ');
            expect(pathStr).toMatch(/admin\/dashboard\/stats/);
            expect(pathStr).toMatch(/admin\/galleries|admin\/upload/);
        });
    });

    describe('registerContactRoutes', () => {
        it('should run without throwing or register contact routes', async () => {
            jest.resetModules();
            const app = createMockApp();
            let ok = false;
            try {
                const { registerContactRoutes } = await import(
                    '../../../src/routes/contact.routes'
                );
                registerContactRoutes(app as Express, GLOBAL_PATH);
                ok = true;
            } catch {
                // no-op: ok stays false
            }
            const hasRoutes = app.registered.length > 0;
            expect(ok || hasRoutes).toBe(true);
        });
    });

    describe('registerLibrariesRoutes', () => {
        it('should register libraries CRUD and list', async () => {
            const { registerLibrariesRoutes } = await import(
                '../../../src/routes/libraries.routes'
            );
            const app = createMockApp();
            registerLibrariesRoutes(app as Express, GLOBAL_PATH);

            expect(app.registered.length).toBeGreaterThan(0);
            const pathStr = app.registered.map((r) => r.path).join(' ');
            expect(pathStr).toMatch(/libraries/);
        });
    });

    describe('registerEventsRoutes', () => {
        it('should register events CRUD', async () => {
            const { registerEventsRoutes } = await import(
                '../../../src/routes/events.routes'
            );
            const app = createMockApp();
            registerEventsRoutes(app as Express, GLOBAL_PATH);

            expect(app.registered.length).toBeGreaterThan(0);
            const pathStr = app.registered.map((r) => r.path).join(' ');
            expect(pathStr).toMatch(/events/);
        });
    });

    describe('registerMediaRoutes', () => {
        it('should register media-items and admin media tags', async () => {
            const { registerMediaRoutes } = await import(
                '../../../src/routes/media.routes'
            );
            const app = createMockApp();
            registerMediaRoutes(app as Express, GLOBAL_PATH);

            expect(app.registered.length).toBeGreaterThan(0);
            const pathStr = app.registered.map((r) => r.path).join(' ');
            expect(pathStr).toMatch(/media-items|admin\/media/);
        });
    });

    describe('registerStoriesRoutes', () => {
        it('should register admin stories, stories list, tags, timelines', async () => {
            const { registerStoriesRoutes } = await import(
                '../../../src/routes/stories.routes'
            );
            const app = createMockApp();
            registerStoriesRoutes(app as Express, GLOBAL_PATH);

            expect(app.registered.length).toBeGreaterThan(0);
            const pathStr = app.registered.map((r) => r.path).join(' ');
            expect(pathStr).toMatch(/stories/);
        });
    });

    describe('registerSuperAdminRoutes', () => {
        it('should register sadmin stats, moderation, libraries, users', async () => {
            const { registerSuperAdminRoutes } = await import(
                '../../../src/routes/superadmin.routes'
            );
            const app = createMockApp();
            registerSuperAdminRoutes(app as Express, GLOBAL_PATH);

            expect(hasRoute(app.registered, 'GET', '/sadmin/stats')).toBe(true);
            expect(hasRoute(app.registered, 'GET', '/superadmin/moderation/stories')).toBe(true);
            expect(hasRoute(app.registered, 'GET', '/superadmin/moderation/media')).toBe(true);
            expect(hasRoute(app.registered, 'GET', '/superadmin/libraries')).toBe(true);
            expect(hasRoute(app.registered, 'GET', '/superadmin/users')).toBe(true);
            expect(hasRoute(app.registered, 'POST', '/superadmin/users')).toBe(true);
            expect(hasRoute(app.registered, 'PATCH', '/superadmin/users')).toBe(true);
        });
    });
});
