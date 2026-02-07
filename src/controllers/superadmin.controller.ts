/**
 * Super Admin Controller
 *
 * Platform-wide stats, pending stories/media approval, library and user
 * management. All endpoints require super_admin role.
 *
 * @module src/controllers/superadmin.controller
 */

import { Request, Response } from 'express';
import { superAdminService } from '../services/superadmin.service';

export class SuperAdminController {
  /**
   * Returns platform-wide dashboard stats (libraries, stories, media, users, activity).
   * @param req - Express request
   * @param res - Express response; sends JSON stats
   */
  async getStats(req: Request, res: Response): Promise<void> {
    const stats = await superAdminService.getStats();
    res.status(200).json(stats);
  }

  /**
   * Returns stories pending approval.
   * @param req - Express request
   * @param res - Express response; sends JSON array of stories
   */
  async getPendingStories(req: Request, res: Response): Promise<void> {
    const stories = await superAdminService.getPendingStories();
    res.status(200).json(stories);
  }

  /**
   * Returns media items pending approval.
   * @param req - Express request
   * @param res - Express response; sends JSON array of media
   */
  async getPendingMedia(req: Request, res: Response): Promise<void> {
    const media = await superAdminService.getPendingMedia();
    res.status(200).json(media);
  }

  /**
   * Approves a story by ID.
   * @param req - Express request; params.id
   * @param res - Express response; sends updated story
   */
  async approveStory(req: Request, res: Response): Promise<void> {
    const storyId = req.params.id;
    const story = await superAdminService.approveStory(storyId);
    res.status(200).json(story);
  }

  /**
   * Rejects a story by ID (sets approved to false).
   * @param req - Express request; params.id
   * @param res - Express response; sends updated story
   */
  async rejectStory(req: Request, res: Response): Promise<void> {
    const storyId = req.params.id;
    const story = await superAdminService.rejectStory(storyId);
    res.status(200).json(story);
  }

  /**
   * Approves a media item by ID.
   * @param req - Express request; params.id
   * @param res - Express response; sends updated media
   */
  async approveMedia(req: Request, res: Response): Promise<void> {
    const mediaId = req.params.id;
    const media = await superAdminService.approveMedia(mediaId);
    res.status(200).json(media);
  }

  /**
   * Rejects a media item by ID (sets approved to false).
   * @param req - Express request; params.id
   * @param res - Express response; sends updated media
   */
  async rejectMedia(req: Request, res: Response): Promise<void> {
    const mediaId = req.params.id;
    const media = await superAdminService.rejectMedia(mediaId);
    res.status(200).json(media);
  }

  async getLibraries(req: Request, res: Response): Promise<void> {
    const libraries = await superAdminService.getLibraries();
    res.status(200).json(libraries);
  }

  /**
   * Returns all users across libraries.
   * @param req - Express request
   * @param res - Express response; sends JSON array of users
   */
  async getUsers(req: Request, res: Response): Promise<void> {
    const users = await superAdminService.getUsers();
    res.status(200).json(users);
  }

  /**
   * Creates a new user from body (password hashed by service).
   * @param req - Express request; body with user fields
   * @param res - Express response; sends 201 and created user
   */
  async createUser(req: Request, res: Response): Promise<void> {
    const user = await superAdminService.createUser(req.body);
    res.status(201).json(user);
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    const userId = req.params.id;
    const user = await superAdminService.updateUser(userId, req.body);
    res.status(200).json(user);
  }

  /**
   * Resets a user's password by ID; body.password is hashed by service.
   * @param req - Express request; params.id, body.password
   * @param res - Express response; sends success message
   */
  async resetUserPassword(req: Request, res: Response): Promise<void> {
    const userId = req.params.id;
    const { password } = req.body;
    await superAdminService.resetUserPassword(userId, password);
    res.status(200).json({ message: 'Password reset successfully' });
  }
}

export const superAdminController = new SuperAdminController();
