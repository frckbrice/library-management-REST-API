/**
 * Media Service
 *
 * List/get/create/update/delete media items. Filters: libraryId, galleryId,
 * mediaType, tags, approved, limit, offset. Create/update support file upload and role checks.
 *
 * @module src/services/media.service
 */

import drizzleService from './drizzle-services';
import { MediaItem, InsertMediaItem } from '../../config/database/schema';
import { NotFoundError, AuthorizationError } from '../utils/errors';
import { logger } from '../middlewares/logger';
import { uploadImageToCloudinary } from '../routes/shared';

export interface MediaFilters {
  libraryId?: string;
  galleryId?: string;
  mediaType?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  approved?: boolean;
}

export interface CreateMediaData extends Partial<Omit<InsertMediaItem, 'url'>> {
  url?: string;
}

export interface UpdateMediaData extends Partial<Omit<InsertMediaItem, 'url'>> {
  url?: string;
}

export class MediaService {
  /** Lists media items with optional filters (libraryId, galleryId, mediaType, tags, approved, limit, offset). */
  async getMediaItems(filters?: MediaFilters): Promise<MediaItem[]> {
    return drizzleService.getMediaItems(filters);
  }

  /** Gets a media item by ID; throws NotFoundError if not found. */
  async getMediaItem(mediaId: string): Promise<MediaItem> {
    const mediaItem = await drizzleService.getMediaItem(mediaId);

    if (!mediaItem) {
      throw new NotFoundError('Media item');
    }

    return mediaItem;
  }

  /** Creates a media item for the library; optional file upload. Requires libraryId and url or file. */
  /** Creates a media item for the library; optional file upload. Requires libraryId and url or file. */
  async createMediaItem(
    data: CreateMediaData,
    libraryId: string,
    file?: Express.Multer.File
  ): Promise<MediaItem> {
    if (!libraryId) {
      throw new Error('Library ID required');
    }

    // Handle media file upload
    let url = data.url || null;
    if (file) {
      try {
        url = await uploadImageToCloudinary(file, 'media');
      } catch (error) {
        throw new Error('Failed to upload media file');
      }
    }

    if (!url) {
      throw new Error('Media URL or file is required');
    }

    const mediaData: InsertMediaItem = {
      ...data,
      libraryId,
      url: url as string,
      isApproved: false, // New media needs approval
      createdAt: new Date(),
    } as InsertMediaItem;

    const mediaItem = await drizzleService.createMediaItem(mediaData);
    logger.info('Media item created', { mediaId: mediaItem.id, libraryId });

    return mediaItem;
  }

  /** Updates a media item by ID; enforces library ownership for library_admin. Optional file upload. */
  /** Updates a media item by ID; enforces library ownership for library_admin. Optional file upload. */
  async updateMediaItem(
    mediaId: string,
    data: UpdateMediaData,
    userLibraryId: string,
    userRole: string,
    file?: Express.Multer.File
  ): Promise<MediaItem> {
    const existingMedia = await drizzleService.getMediaItem(mediaId);

    if (!existingMedia) {
      throw new NotFoundError('Media item');
    }

    // Check ownership
    if (userRole === 'library_admin' && existingMedia.libraryId !== userLibraryId) {
      throw new AuthorizationError('You can only edit media for your library');
    }

    // Handle media file upload
    let url: string | null = data.url ?? existingMedia.url;
    if (file) {
      try {
        url = await uploadImageToCloudinary(file, 'media');
      } catch (error) {
        throw new Error('Failed to upload media file');
      }
    }

    const updateData: Partial<MediaItem> = {
      ...data,
      url: url ?? existingMedia.url,
    };

    const updatedMedia = await drizzleService.updateMediaItem(mediaId, updateData);
    if (!updatedMedia) {
      throw new Error('Failed to update media item');
    }
    logger.info('Media item updated', { mediaId });

    return updatedMedia;
  }

  /** Returns sorted list of all unique media tags. */
  /** Returns sorted list of all unique media tags. */
  async getMediaTags(): Promise<string[]> {
    const mediaItems = await drizzleService.getMediaItems();
    const allTags = new Set<string>();
    mediaItems.forEach((item) => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach((tag) => allTags.add(tag));
      }
    });
    return Array.from(allTags).sort();
  }
}

export const mediaService = new MediaService();
