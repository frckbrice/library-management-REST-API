/**
 * Admin Service
 *
 * Library-admin dashboard: stats, analytics, activity, galleries, and
 * Cloudinary image deletion. All operations are scoped by libraryId where applicable.
 *
 * @module src/services/admin.service
 */

import drizzleService from './drizzle-services';
import { logger } from '../middlewares/logger';

export interface DashboardStats {
  totalStories: number;
  publishedStories: number;
  totalMedia: number;
  approvedMedia: number;
  totalEvents: number;
  upcomingEvents: number;
  totalMessages: number;
  unreadMessages: number;
}

export interface AnalyticsData {
  visitorData: Array<{
    date: string;
    visitors: number;
    uniqueVisitors: number;
  }>;
  contentData: Array<{
    name: string;
    views: number;
    engagement: number;
  }>;
  engagementData: Array<{
    date: string;
    avgTimeSpent: number;
    interactionRate: number;
  }>;
  topPerformers: {
    topStory: string;
    topStoryViews: number;
    topGallery: string;
    topGalleryViews: number;
    avgTimeOnPage: string;
    avgTimeIncrease: number;
  };
}

export interface ActivityItem {
  type: string;
  title: string;
  timestamp: Date | string | null;
  status: string;
}

export class AdminService {
  /** Aggregates dashboard counts (stories, media, events, messages) for a library. */
  async getDashboardStats(libraryId: string): Promise<DashboardStats> {
    const stories = await drizzleService.getStories({ libraryId });
    const mediaItems = await drizzleService.getMediaItems({ libraryId });
    const events = await drizzleService.getEvents({ libraryId });
    const messages = await drizzleService.getContactMessages({ libraryId });

    return {
      totalStories: stories.length,
      publishedStories: stories.filter((s) => s.isPublished).length,
      totalMedia: mediaItems.length,
      approvedMedia: mediaItems.filter((m) => m.isApproved).length,
      totalEvents: events.length,
      upcomingEvents: events.filter((e) => new Date(e.eventDate) > new Date()).length,
      totalMessages: messages.length,
      unreadMessages: messages.filter((m) => !m.isRead).length,
    };
  }

  /** Builds analytics payload (visitor/content/engagement/top performers) for a library. */
  async getDashboardAnalytics(libraryId: string): Promise<AnalyticsData> {
    const analytics = await drizzleService.getAnalytics({ libraryId });

    // Process analytics data for charts
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const visitorData = last30Days.map((date) => {
      const dayAnalytics = analytics.filter(
        (a) => a.date && new Date(a.date).toISOString().split('T')[0] === date
      );
      const totalViews = dayAnalytics.reduce((sum, a) => sum + (a.views || 0), 0);

      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        visitors: totalViews,
        uniqueVisitors: Math.floor(totalViews * 0.7), // Approximate unique visitors
      };
    });

    const contentData = [
      {
        name: 'Stories',
        views: analytics.filter((a) => a.storyId).reduce((sum, a) => sum + (a.views || 0), 0),
        engagement: 75,
      },
      {
        name: 'Gallery',
        views: analytics
          .filter((a) => a.pageType === 'gallery')
          .reduce((sum, a) => sum + (a.views || 0), 0),
        engagement: 85,
      },
      {
        name: 'Library Profile',
        views: analytics
          .filter((a) => a.pageType === 'library_profile')
          .reduce((sum, a) => sum + (a.views || 0), 0),
        engagement: 65,
      },
    ];

    const engagementData = last30Days.slice(-7).map((date) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      avgTimeSpent: Math.floor(Math.random() * 300) + 120, // Mock data for demo
      interactionRate: Math.floor(Math.random() * 40) + 60,
    }));

    const topPerformers = {
      topStory: 'Featured Exhibition',
      topStoryViews: Math.max(...analytics.filter((a) => a.storyId).map((a) => a.views || 0), 0),
      topGallery: 'Main Collection',
      topGalleryViews: Math.max(
        ...analytics.filter((a) => a.pageType === 'gallery').map((a) => a.views || 0),
        0
      ),
      avgTimeOnPage: '4:32',
      avgTimeIncrease: 12,
    };

    return {
      visitorData,
      contentData,
      engagementData,
      topPerformers,
    };
  }

  /** Returns recent activity (stories, messages, events) for a library. */
  async getDashboardActivity(libraryId: string): Promise<ActivityItem[]> {
    const stories = await drizzleService.getStories({ libraryId, limit: 5 });
    const messages = await drizzleService.getContactMessages({ libraryId, limit: 5 });
    const events = await drizzleService.getEvents({ libraryId, limit: 5 });

    const recentActivity: ActivityItem[] = [
      ...stories.map((s) => ({
        type: 'story',
        title: `Story updated: ${s.title}`,
        timestamp: s.updatedAt || s.createdAt,
        status: s.isPublished ? 'published' : 'draft',
      })),
      ...messages.map((m) => ({
        type: 'message',
        title: `New inquiry: ${m.subject}`,
        timestamp: m.createdAt,
        status: m.isRead ? 'read' : 'unread',
      })),
      ...events.map((e) => ({
        type: 'event',
        title: `Event: ${e.title}`,
        timestamp: e.createdAt,
        status: e.isPublished ? 'published' : 'draft',
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime()
      )
      .slice(0, 10);

    return recentActivity;
  }

  /** Returns list of all gallery names/ids from media. */
  async getGalleries() {
    return drizzleService.getGalleries();
  }

  /** Deletes an image from Cloudinary by public ID. Throws if not configured or delete fails. */
  async deleteImage(publicId: string): Promise<boolean> {
    const { cloudinaryService } = await import('../../config/bucket-storage/cloudinary');

    if (!cloudinaryService.isReady()) {
      throw new Error('Cloudinary not configured');
    }

    try {
      // Decode the public ID (it may be URL encoded)
      const decodedPublicId = decodeURIComponent(publicId);
      const success = await cloudinaryService.deleteImage(decodedPublicId);

      if (!success) {
        throw new Error('Image not found or already deleted');
      }

      logger.info('Image deleted', { publicId: decodedPublicId });
      return true;
    } catch (error) {
      throw new Error(
        `Failed to delete image: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

export const adminService = new AdminService();
