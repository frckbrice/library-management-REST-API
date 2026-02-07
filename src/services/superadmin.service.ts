/**
 * Super Admin Service
 *
 * Platform-wide stats, pending stories/media, approve/reject, library and user
 * management. All operations assume super_admin authorization is enforced by route/middleware.
 *
 * @module src/services/superadmin.service
 */

import drizzleService from './drizzle-services';
import bcrypt from 'bcrypt';
import { User, InsertUser } from '../../config/database/schema';
import { NotFoundError } from '../utils/errors';
import { logger } from '../middlewares/logger';

export interface SuperAdminStats {
  totalLibraries: number;
  pendingLibraries: number;
  totalStories: number;
  pendingStories: number;
  totalMedia: number;
  uniqueGalleries: number;
  totalUsers: number;
  activeUsers: number;
  recentActivity: Array<{
    type: string;
    user: string;
    title?: string;
    library?: string;
    count?: number;
    timestamp: Date;
  }>;
}

export class SuperAdminService {
  /** Returns platform-wide stats (libraries, stories, media, users, recent activity). */
  async getStats(): Promise<SuperAdminStats> {
    // Get counts of various entities for the dashboard
    const libraries = await drizzleService.getLibraries();
    const stories = await drizzleService.getStories();
    const mediaItems = await drizzleService.getMediaItems();
    const usersPromises = libraries.map((library) =>
      drizzleService.getUsersByLibraryId(library.id)
    );
    const usersArrays = await Promise.all(usersPromises);
    const users = usersArrays.flat();

    return {
      totalLibraries: libraries.length,
      pendingLibraries: libraries.filter((m) => !m.isApproved).length,
      totalStories: stories.length,
      pendingStories: stories.filter((s) => !s.isApproved).length,
      totalMedia: mediaItems.length,
      uniqueGalleries: Array.from(new Set(mediaItems.map((m) => m.galleryId))).length,
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.lastLoginAt !== null).length,
      recentActivity: [
        {
          type: 'user_signup',
          user: 'National Gallery Admin',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
        },
        {
          type: 'story_published',
          user: 'MoMA Admin',
          title: 'Summer Exhibition Preview',
          timestamp: new Date(Date.now() - 1000 * 60 * 60),
        },
        {
          type: 'media_uploaded',
          user: 'Louvre Admin',
          count: 15,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
        },
        {
          type: 'library_approved',
          user: 'Super Admin',
          library: 'Contemporary Arts Center',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
        },
      ],
    };
  }

  /** Returns stories that are not approved. */
  /** Returns stories that are not approved. */
  async getPendingStories() {
    return drizzleService.getStories({ approved: false });
  }

  /** Returns media items that are not approved. */
  /** Returns media items that are not approved. */
  async getPendingMedia() {
    return drizzleService.getMediaItems({ approved: false });
  }

  /** Sets story as approved; throws NotFoundError if not found. */
  async approveStory(storyId: string) {
    const updatedStory = await drizzleService.updateStory(storyId, {
      isApproved: true,
    });

    if (!updatedStory) {
      throw new NotFoundError('Story');
    }

    logger.info('Story approved', { storyId });
    return updatedStory;
  }

  /** Sets story as not approved; throws NotFoundError if not found. */
  /** Sets story as not approved; throws NotFoundError if not found. */
  async rejectStory(storyId: string) {
    const updatedStory = await drizzleService.updateStory(storyId, { isApproved: false });

    if (!updatedStory) {
      throw new NotFoundError('Story');
    }

    logger.info('Story rejected', { storyId });
    return updatedStory;
  }

  /** Sets media item as approved; throws NotFoundError if not found. */
  async approveMedia(mediaId: string) {
    const updatedMedia = await drizzleService.updateMediaItem(mediaId, { isApproved: true });

    if (!updatedMedia) {
      throw new NotFoundError('Media item');
    }

    logger.info('Media approved', { mediaId });
    return updatedMedia;
  }

  /** Sets media item as not approved; throws NotFoundError if not found. */
  /** Sets media item as not approved; throws NotFoundError if not found. */
  async rejectMedia(mediaId: string) {
    const updatedMedia = await drizzleService.updateMediaItem(mediaId, { isApproved: false });

    if (!updatedMedia) {
      throw new NotFoundError('Media item');
    }

    logger.info('Media rejected', { mediaId });
    return updatedMedia;
  }

  /** Returns all libraries. */
  async getLibraries() {
    return drizzleService.getLibraries();
  }

  async getUsers(): Promise<User[]> {
    // Get all users across all libraries
    const libraries = await drizzleService.getLibraries();
    const usersPromises = libraries.map((library) =>
      drizzleService.getUsersByLibraryId(library.id)
    );
    const usersArrays = await Promise.all(usersPromises);
    return usersArrays.flat();
  }

  /** Creates a user; hashes password. Requires username, password, email, fullName, role. */
  async createUser(userData: Partial<InsertUser> & { password: string }): Promise<User> {
    // Validate required fields
    if (
      !userData.username ||
      !userData.password ||
      !userData.email ||
      !userData.fullName ||
      !userData.role
    ) {
      throw new Error('Missing required fields');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUser = await drizzleService.createUser({
      username: userData.username,
      password: hashedPassword,
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role,
      libraryId: userData.libraryId || null,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
    });

    logger.info('User created', { userId: newUser.id, username: newUser.username });
    return newUser;
  }

  async updateUser(userId: string, updateData: Partial<User>): Promise<User> {
    const updatedUser = await drizzleService.updateUser(userId, updateData);

    if (!updatedUser) {
      throw new NotFoundError('User');
    }

    logger.info('User updated', { userId });
    return updatedUser;
  }

  /** Resets user password (hashed); throws if user not found or password empty. */
  async resetUserPassword(userId: string, password: string): Promise<void> {
    if (!password) {
      throw new Error('Password is required');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    const updatedUser = await drizzleService.updateUser(userId, { password: hashedPassword });

    if (!updatedUser) {
      throw new NotFoundError('User');
    }

    logger.info('User password reset', { userId });
  }
}

export const superAdminService = new SuperAdminService();
