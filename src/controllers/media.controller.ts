/**
 * Media Controller
 *
 * List/get/create/update/delete media items. List supports libraryId, galleryId,
 * mediaType, tags, approved, limit, offset. Create/update require auth and libraryId.
 *
 * @module src/controllers/media.controller
 */

import { Request, Response } from 'express';
import { mediaService } from '../services/media.service';
import { AuthorizationError } from '../utils/errors';

export class MediaController {
  /**
   * Lists media items with optional filters: libraryId, galleryId, mediaType, tags, approved, limit, offset.
   * @param req - Express request; query params for filters
   * @param res - Express response; sends JSON array of media items
   */
  async getMediaItems(req: Request, res: Response): Promise<void> {
    const libraryId = req.query.libraryId ? String(req.query.libraryId) : undefined;
    const galleryId = req.query.galleryId ? String(req.query.galleryId) : undefined;

    // Handle boolean parameters properly
    let approved = undefined;
    if (req.query.approved !== undefined) {
      approved = req.query.approved === 'true';
    }

    const mediaType = req.query.mediaType ? String(req.query.mediaType) : undefined;
    const tags = req.query.tag
      ? Array.isArray(req.query.tag)
        ? (req.query.tag as string[])
        : [req.query.tag as string]
      : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;

    const media = await mediaService.getMediaItems({
      libraryId,
      galleryId,
      mediaType,
      tags,
      limit,
      offset,
      approved,
    });

    res.status(200).json(media);
  }

  async getMediaItem(req: Request, res: Response): Promise<void> {
    const mediaId = req.params.id;
    const mediaItem = await mediaService.getMediaItem(mediaId);
    res.status(200).json(mediaItem);
  }

  /**
   * Creates a new media item for the session user's library; optional file upload.
   * @param req - Express request; body + optional req.file
   * @param res - Express response; sends 201 and created media item
   */
  async createMediaItem(req: Request, res: Response): Promise<void> {
    if (!req.session.user) {
      throw new AuthorizationError('Unauthorized - not logged in');
    }
    const libraryId = req.session.user.libraryId;
    if (!libraryId) {
      throw new AuthorizationError('Library context required');
    }
    const mediaItem = await mediaService.createMediaItem(req.body, libraryId, req.file);

    res.status(201).json(mediaItem);
  }

  async updateMediaItem(req: Request, res: Response): Promise<void> {
    if (!req.session.user) {
      throw new AuthorizationError('Unauthorized - not logged in');
    }
    const libraryId = req.session.user.libraryId;
    if (!libraryId) {
      throw new AuthorizationError('Library context required');
    }
    const mediaId = req.params.id;
    const role = req.session.user.role;

    const updatedMedia = await mediaService.updateMediaItem(
      mediaId,
      req.body,
      libraryId,
      role,
      req.file
    );

    res.status(200).json(updatedMedia);
  }

  /**
   * Returns all unique media tags (requires authenticated user).
   * @param req - Express request
   * @param res - Express response; sends JSON array of tag strings
   */
  async getMediaTags(req: Request, res: Response): Promise<void> {
    if (!req.session.user) {
      throw new AuthorizationError('Unauthorized - not logged in');
    }

    const tags = await mediaService.getMediaTags();
    res.status(200).json(tags);
  }
}

export const mediaController = new MediaController();
