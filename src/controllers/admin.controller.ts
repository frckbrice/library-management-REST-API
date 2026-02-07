/**
 * Admin Controller
 *
 * Library-admin scoped: dashboard stats/analytics/activity, galleries, and
 * image deletion. Uses session user's libraryId where applicable.
 *
 * @module src/controllers/admin.controller
 */

import { Request, Response } from 'express';
import { adminService } from '../services/admin.service';

export class AdminController {
  /**
   * Returns dashboard stats (stories, media, events, messages counts) for the session user's library.
   * @param req - Express request; session must contain user with libraryId
   * @param res - Express response; sends JSON stats
   */
  async getDashboardStats(req: Request, res: Response): Promise<void> {
    const libraryId = req.session.user?.libraryId;
    if (!libraryId) {
      throw new Error('Library ID required');
    }

    const stats = await adminService.getDashboardStats(libraryId);
    res.status(200).json(stats);
  }

  async getDashboardAnalytics(req: Request, res: Response): Promise<void> {
    const libraryId = req.session.user?.libraryId;
    if (!libraryId) {
      throw new Error('Library ID required');
    }

    const analytics = await adminService.getDashboardAnalytics(libraryId);
    res.status(200).json(analytics);
  }

  /**
   * Returns recent activity (stories, messages, events) for the session user's library.
   * @param req - Express request; session must contain user with libraryId
   * @param res - Express response; sends JSON activity list
   */
  async getDashboardActivity(req: Request, res: Response): Promise<void> {
    const libraryId = req.session.user?.libraryId;
    if (!libraryId) {
      throw new Error('Library ID required');
    }

    const activity = await adminService.getDashboardActivity(libraryId);
    res.status(200).json(activity);
  }

  /**
   * Returns list of all galleries (no library filter).
   * @param req - Express request
   * @param res - Express response; sends JSON array of galleries
   */
  async getGalleries(req: Request, res: Response): Promise<void> {
    const galleries = await adminService.getGalleries();
    res.status(200).json(galleries);
  }

  /**
   * Deletes an image from Cloudinary by public ID. Requires session user.
   * @param req - Express request; params.publicId is the Cloudinary public ID
   * @param res - Express response; sends success message
   */
  async deleteImage(req: Request, res: Response): Promise<void> {
    const { publicId } = req.params;
    await adminService.deleteImage(publicId);
    res.status(200).json({ success: true, message: 'Image deleted successfully' });
  }
}

export const adminController = new AdminController();
