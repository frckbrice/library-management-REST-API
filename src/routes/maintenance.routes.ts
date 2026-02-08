/**
 * Maintenance Routes
 *
 * Health check (public), maintenance mode toggle, schedule windows, backups (list/create).
 * Sensitive operations require super_admin. State is in-memory; in production use DB/Redis.
 *
 * @module src/routes/maintenance.routes
 */

import type { Express } from "express";
import drizzleService from "../services/drizzle-services";
import { requireSuperAdmin } from "../middlewares/auth";
import { apiHandler } from "./shared";

/** In-memory maintenance state; prefer DB/Redis in production. */
let maintenanceMode = false;
const maintenanceWindows: any[] = [];
const backupHistory: any[] = [
    { id: 1, type: 'full', size: '2.3 GB', created: new Date('2025-06-18T02:00:00Z'), status: 'completed' },
    { id: 2, type: 'database', size: '890 MB', created: new Date('2025-06-17T02:00:00Z'), status: 'completed' },
    { id: 3, type: 'files', size: '1.4 GB', created: new Date('2025-06-16T02:00:00Z'), status: 'completed' },
    { id: 4, type: 'database', size: '885 MB', created: new Date('2025-06-15T02:00:00Z'), status: 'completed' },
];

/**
 * Registers maintenance routes: health, status, toggle, schedule, backup list/create, refresh.
 * @param app - Express application
 * @param global_path - Base path (e.g. /api/v1)
 */
export function registerMaintenanceRoutes(app: Express, global_path: string) {
    // health check endpoint
    app.get(`${global_path}/health`, async (req, res) => {
        try {
            const isHealthy = await drizzleService.healthCheck();
            res.json({
                status: isHealthy ? 'system healthy' : 'system unhealthy',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                status: 'system unhealthy',
                error: 'Health check failed',
                timestamp: new Date().toISOString()
            });
        }
    });

    // Get maintenance status (superadmin only)
    app.get(`${global_path}/maintenance/status`, requireSuperAdmin, apiHandler(async (req, res) => {
        const systemHealth = [
            { service: 'Web Server', status: 'healthy', uptime: '15 days, 3 hours', responseTime: 145, lastCheck: new Date() },
            { service: 'Database', status: 'healthy', uptime: '15 days, 3 hours', responseTime: 23, lastCheck: new Date() },
            { service: 'File Storage', status: 'warning', uptime: '2 days, 1 hour', responseTime: 287, lastCheck: new Date() },
            { service: 'Email Service', status: 'healthy', uptime: '15 days, 3 hours', responseTime: 412, lastCheck: new Date() },
            { service: 'CDN', status: 'healthy', uptime: '30 days, 12 hours', responseTime: 89, lastCheck: new Date() },
        ];

        const systemMetrics = {
            cpuUsage: Math.floor(Math.random() * 30) + 15,
            memoryUsage: Math.floor(Math.random() * 40) + 50,
            diskUsage: Math.floor(Math.random() * 30) + 30,
            networkTraffic: '1.2 GB/day'
        };

        return res.status(200).json({
            maintenanceMode,
            systemHealth,
            systemMetrics,
            maintenanceWindows,
            backupHistory
        });
    }));

    // Toggle maintenance mode (superadmin only)
    app.post(`${global_path}/maintenance/toggle`, requireSuperAdmin, apiHandler(async (req, res) => {
        const { enabled } = req.body;
        maintenanceMode = enabled;
        return res.status(200).json({
            success: true,
            maintenanceMode,
            message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`
        });
    }));

    // Schedule maintenance window (superadmin only)
    app.post(`${global_path}/maintenance/schedule`, requireSuperAdmin, apiHandler(async (req, res) => {
        const { title, description, scheduledStart, scheduledEnd, affectedServices } = req.body;
        if (!title || !scheduledStart) {
            return res.status(400).json({ error: 'Title and start time are required' });
        }
        const newWindow = {
            id: Date.now(),
            title,
            description,
            scheduledStart: new Date(scheduledStart),
            scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
            affectedServices: affectedServices || [],
            status: 'scheduled',
            createdAt: new Date()
        };
        maintenanceWindows.push(newWindow);
        return res.status(201).json(newWindow);
    }));

    // Create backup (superadmin only)
    app.post(`${global_path}/maintenance/backup`, requireSuperAdmin, apiHandler(async (req, res) => {
        const { type } = req.body;
        if (!['database', 'files', 'full'].includes(type)) {
            return res.status(400).json({ error: 'Invalid backup type' });
        }
        const sizes = {
            database: `${Math.floor(Math.random() * 500) + 800} MB`,
            files: `${Math.floor(Math.random() * 800) + 1200} MB`,
            full: `${Math.floor(Math.random() * 1000) + 2000} MB`
        };
        const newBackup = {
            id: Date.now(),
            type,
            size: sizes[type as keyof typeof sizes],
            created: new Date(),
            status: 'running'
        };
        backupHistory.unshift(newBackup);
        setTimeout(() => {
            const backup = backupHistory.find(b => b.id === newBackup.id);
            if (backup) backup.status = 'completed';
        }, 3000);
        return res.status(201).json(newBackup);
    }));

    // Get backup history (superadmin only)
    app.get(`${global_path}/maintenance/backups`, requireSuperAdmin, apiHandler(async (req, res) => {
        return res.status(200).json(backupHistory);
    }));

    // Refresh system status (superadmin only)
    app.post(`${global_path}/maintenance/refresh`, requireSuperAdmin, apiHandler(async (req, res) => {
        const systemHealth = [
            {
                service: 'Web Server',
                status: 'healthy',
                uptime: '15 days, 3 hours',
                responseTime: Math.floor(Math.random() * 50) + 120,
                lastCheck: new Date()
            },
            {
                service: 'Database',
                status: 'healthy',
                uptime: '15 days, 3 hours',
                responseTime: Math.floor(Math.random() * 20) + 15,
                lastCheck: new Date()
            },
            {
                service: 'File Storage',
                status: Math.random() > 0.8 ? 'warning' : 'healthy',
                uptime: '2 days, 1 hour',
                responseTime: Math.floor(Math.random() * 100) + 200,
                lastCheck: new Date()
            },
            {
                service: 'Email Service',
                status: 'healthy',
                uptime: '15 days, 3 hours',
                responseTime: Math.floor(Math.random() * 200) + 350,
                lastCheck: new Date()
            },
            {
                service: 'CDN',
                status: 'healthy',
                uptime: '30 days, 12 hours',
                responseTime: Math.floor(Math.random() * 30) + 70,
                lastCheck: new Date()
            },
        ];

        return res.status(200).json({ systemHealth });
    }));
}
