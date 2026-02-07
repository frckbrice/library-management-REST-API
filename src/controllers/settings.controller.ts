/**
 * Settings Controller
 *
 * Global app settings: get, update, and test email configuration.
 *
 * @module src/controllers/settings.controller
 */

import { Request, Response } from 'express';
import { settingsService } from '../services/settings.service';

export class SettingsController {
  /**
   * Returns current platform settings.
   * @param req - Express request
   * @param res - Express response; sends settings object
   */
  async getSettings(req: Request, res: Response): Promise<void> {
    const settings = await settingsService.getSettings();
    res.status(200).json(settings);
  }

  /**
   * Updates platform settings from body (merged with existing).
   * @param req - Express request; body with partial settings
   * @param res - Express response; sends updated settings
   */
  async updateSettings(req: Request, res: Response): Promise<void> {
    const settings = await settingsService.updateSettings(req.body);
    res.status(200).json(settings);
  }

  /**
   * Sends a test email to verify email configuration.
   * @param req - Express request
   * @param res - Express response; sends test result message
   */
  async testEmail(req: Request, res: Response): Promise<void> {
    const result = await settingsService.testEmail();
    res.status(200).json(result);
  }
}

export const settingsController = new SettingsController();
