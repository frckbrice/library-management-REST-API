/**
 * Stories Service
 *
 * Business logic for stories and timelines: create, update, get, list (with
 * filters), tags, timelines by story. Delegates to drizzleService and
 * uploadImageToCloudinary for persistence and media.
 *
 * @module src/services/stories.service
 */

import drizzleService from './drizzle-services';
import { Story, InsertStory } from '../../config/database/schema';
import { NotFoundError, AuthorizationError } from '../utils/errors';
import { logger } from '../middlewares/logger';
import { uploadImageToCloudinary } from '../routes/shared';

export interface StoryFilters {
  libraryId?: string;
  published?: boolean;
  approved?: boolean;
  featured?: boolean;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface CreateStoryData extends Partial<InsertStory> {
  featuredImageUrl?: string | null;
  isPublished?: boolean;
}

export interface UpdateStoryData extends Partial<InsertStory> {
  featuredImageUrl?: string | null;
}

export class StoriesService {
  /** Creates a story for the library; optional featured image upload. */
  async createStory(
    data: CreateStoryData,
    libraryId: string,
    file?: Express.Multer.File
  ): Promise<Story> {
    // Handle featured image upload
    let featuredImageUrl = data.featuredImageUrl || null;
    if (file) {
      featuredImageUrl = await uploadImageToCloudinary(file, 'stories');
    }

    const storyData: InsertStory = {
      ...data,
      libraryId,
      featuredImageUrl,
      isApproved: false, // New stories need approval
      isPublished: data.isPublished || false,
      isFeatured: false, // Only super admin can feature stories
      createdAt: new Date(),
    } as InsertStory;

    const story = await drizzleService.createStory(storyData);
    logger.info('Story created', { storyId: story.id, libraryId });

    return story;
  }

  /** Updates a story by ID; enforces library ownership for library_admin. Preserves approval status. */
  async updateStory(
    storyId: string,
    data: UpdateStoryData,
    userLibraryId: string,
    userRole: string,
    file?: Express.Multer.File
  ): Promise<Story> {
    const existingStory = await drizzleService.getStory(storyId);

    if (!existingStory) {
      throw new NotFoundError('Story');
    }

    // Check ownership for library admins
    if (userRole === 'library_admin' && existingStory.libraryId !== userLibraryId) {
      throw new AuthorizationError('You can only edit stories for your library');
    }

    // Handle featured image upload
    let featuredImageUrl = data.featuredImageUrl ?? existingStory.featuredImageUrl;
    if (file) {
      featuredImageUrl = await uploadImageToCloudinary(file, 'stories');
    }

    // Preserve approval status - only super admin can change this
    const updateData: Partial<Story> = {
      ...data,
      featuredImageUrl,
      isApproved: existingStory.isApproved, // Preserve approval status
      updatedAt: new Date(),
    };

    const updatedStory = await drizzleService.updateStory(storyId, updateData);
    if (!updatedStory) {
      throw new Error('Failed to update story');
    }
    logger.info('Story updated', { storyId, libraryId: userLibraryId });

    return updatedStory;
  }

  /** Gets a story by ID; throws NotFoundError if not found. */
  async getStory(storyId: string): Promise<Story> {
    const story = await drizzleService.getStory(storyId);

    if (!story) {
      throw new NotFoundError('Story');
    }

    return story;
  }

  /** Lists stories with optional filters (libraryId, published, approved, featured, tags, limit, offset). */
  async getStories(filters?: StoryFilters): Promise<Story[]> {
    return drizzleService.getStories(filters);
  }

  /** Returns sorted list of unique tags from published+approved stories. */
  async getStoryTags(): Promise<string[]> {
    const stories = await drizzleService.getStories({ published: true, approved: true });
    const allTags = new Set<string>();

    stories.forEach((story) => {
      if (story.tags && Array.isArray(story.tags)) {
        story.tags.forEach((tag) => allTags.add(tag));
      }
    });

    return Array.from(allTags).sort();
  }

  /** Returns timelines for a story; throws NotFoundError if story not found. */
  async getTimelinesByStoryId(storyId: string) {
    // Verify story exists
    const story = await drizzleService.getStory(storyId);
    if (!story) {
      throw new NotFoundError('Story');
    }

    return drizzleService.getTimelinesByStoryId(storyId);
  }

  /** Creates a timeline for a story; throws NotFoundError if story not found. */
  /** Creates a timeline for a story; throws NotFoundError if story not found. */
  async createTimeline(storyId: string, timelineData: any) {
    // Verify story exists
    const story = await drizzleService.getStory(storyId);
    if (!story) {
      throw new NotFoundError('Story');
    }

    const timeline = await drizzleService.createTimeline({
      ...timelineData,
      storyId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    logger.info('Timeline created', { timelineId: timeline.id, storyId });
    return timeline;
  }
}

export const storiesService = new StoriesService();
