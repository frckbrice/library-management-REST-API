/**
 * Stories Controller
 *
 * CRUD for stories and timelines. Create/update use session libraryId and
 * optional file upload. List supports libraryId, published, approved, featured,
 * tags, limit, offset. Also exposes story tags and timeline by story.
 *
 * @module src/controllers/stories.controller
 */

import { Request, Response } from 'express';
import { storiesService } from '../services/stories.service';

export class StoriesController {
  /**
   * Creates a new story for the session user's library; optional featured image upload.
   * @param req - Express request; body + optional req.file
   * @param res - Express response; sends 201 and created story
   */
  async createStory(req: Request, res: Response): Promise<void> {
    const libraryId = req.session.user!.libraryId ?? '';
    const story = await storiesService.createStory(req.body, libraryId, req.file);

    res.status(201).json({
      success: true,
      data: story,
    });
  }

  /**
   * Updates a story by ID; uses session libraryId and role. Optional featured image upload.
   * @param req - Express request; params.id, body, optional req.file
   * @param res - Express response; sends updated story
   */
  async updateStory(req: Request, res: Response): Promise<void> {
    const storyId = req.params.id;
    const libraryId = req.session.user!.libraryId ?? '';
    const role = req.session.user!.role ?? '';

    const updatedStory = await storiesService.updateStory(
      storyId,
      req.body,
      libraryId,
      role,
      req.file
    );

    res.status(200).json({
      success: true,
      data: updatedStory,
    });
  }

  async getStory(req: Request, res: Response): Promise<void> {
    const storyId = req.params.id;
    const story = await storiesService.getStory(storyId);

    res.status(200).json({
      success: true,
      data: story,
    });
  }

  /**
   * Lists stories with optional filters: libraryId, published, approved, featured, tags, limit, offset.
   * @param req - Express request; query params for filters
   * @param res - Express response; sends JSON array of stories
   */
  async getStories(req: Request, res: Response): Promise<void> {
    // Extract query parameters
    const libraryId = req.query.libraryId ? String(req.query.libraryId) : undefined;

    // Handle boolean parameters properly
    let published = undefined;
    if (req.query.published !== undefined) {
      published = req.query.published === 'true';
    }

    let approved = undefined;
    if (req.query.approved !== undefined) {
      approved = req.query.approved === 'true';
    }

    let featured = undefined;
    if (req.query.featured !== undefined) {
      featured = req.query.featured === 'true';
    }

    const tags = req.query.tag
      ? Array.isArray(req.query.tag)
        ? (req.query.tag as string[])
        : [req.query.tag as string]
      : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;

    const stories = await storiesService.getStories({
      libraryId,
      published,
      approved,
      featured,
      tags,
      limit,
      offset,
    });

    res.status(200).json(stories);
  }

  /**
   * Returns all unique story tags.
   * @param req - Express request
   * @param res - Express response; sends JSON array of tag strings
   */
  async getStoryTags(req: Request, res: Response): Promise<void> {
    const tags = await storiesService.getStoryTags();
    res.status(200).json(tags);
  }

  async getTimelines(req: Request, res: Response): Promise<void> {
    const storyId = req.params.id;
    const timelines = await storiesService.getTimelinesByStoryId(storyId);
    res.status(200).json(timelines);
  }

  /**
   * Creates a new timeline for a story.
   * @param req - Express request; params.id (storyId), body with timeline data
   * @param res - Express response; sends created timeline
   */
  async createTimeline(req: Request, res: Response): Promise<void> {
    const storyId = req.params.id;
    const timeline = await storiesService.createTimeline(storyId, req.body);
    res.status(200).json(timeline);
  }
}

export const storiesController = new StoriesController();
