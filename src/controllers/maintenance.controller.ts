/**
 * Maintenance Controller
 *
 * Health check, maintenance mode toggle, scheduled maintenance windows,
 * and backup list/create. Used by ops and super-admin.
 *
 * @module src/controllers/maintenance.controller
 */

import { Request, Response } from 'express';
import { maintenanceService } from '../services/maintenance.service';

export class MaintenanceController {
  /**
   * Performs a health check (e.g. DB connectivity) and returns system status.
   * @param req - Express request
   * @param res - Express response; sends status and timestamp
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const isHealthy = await maintenanceService.healthCheck();
      res.json({
        status: isHealthy ? 'system healthy' : 'system unhealthy',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        status: 'system unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  async getMaintenanceStatus(req: Request, res: Response): Promise<void> {
    const status = await maintenanceService.getMaintenanceStatus();
    res.status(200).json(status);
  }

  /**
   * Enables or disables maintenance mode from body.enabled.
   * @param req - Express request; body.enabled boolean
   * @param res - Express response; sends updated maintenanceMode and message
   */
  async toggleMaintenanceMode(req: Request, res: Response): Promise<void> {
    const { enabled } = req.body;
    const maintenanceMode = await maintenanceService.toggleMaintenanceMode(enabled);

    res.status(200).json({
      success: true,
      maintenanceMode,
      message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
    });
  }

  async scheduleMaintenance(req: Request, res: Response): Promise<void> {
    const window = await maintenanceService.scheduleMaintenance(req.body);
    res.status(201).json(window);
  }

  /**
   * Creates a backup of the given type (e.g. database, files, full).
   * @param req - Express request; body.type
   * @param res - Express response; sends 201 and backup record
   */
  async createBackup(req: Request, res: Response): Promise<void> {
    const { type } = req.body;
    const backup = await maintenanceService.createBackup(type);
    res.status(201).json(backup);
  }

  async getBackups(req: Request, res: Response): Promise<void> {
    const backups = await maintenanceService.getBackups();
    res.status(200).json(backups);
  }

  /**
   * Refreshes and returns current system health metrics.
   * @param req - Express request
   * @param res - Express response; sends systemHealth data
   */
  async refreshSystemStatus(req: Request, res: Response): Promise<void> {
    const status = await maintenanceService.refreshSystemStatus();
    res.status(200).json(status);
  }
}

export const maintenanceController = new MaintenanceController();
