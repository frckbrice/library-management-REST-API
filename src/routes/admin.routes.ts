/**
 * Admin Routes
 *
 * Library-admin dashboard: stats, analytics, activity, galleries, image delete.
 * All endpoints require requireAuth; libraryId is taken from session.
 *
 * @module src/routes/admin.routes
 */

import type { Express } from "express";
import drizzleService from "../services/drizzle-services";
import { requireAuth } from "../middlewares/auth";
import { apiHandler } from "./shared";
import { sendApiError, ErrorCode } from "../utils/api-response";

/**
 * Registers admin routes: dashboard stats, analytics, activity, galleries, and image delete.
 * All routes use requireAuth and session libraryId where applicable.
 * @param app - Express application
 * @param global_path - Base path (e.g. /api/v1)
 */
export function registerAdminRoutes(app: Express, global_path: string) {
    app.get(`${global_path}/admin/dashboard/stats`, requireAuth, async (req, res) => {
        try {
            const libraryId = req.session.user?.libraryId;
            if (!libraryId) {
                return res.status(400).json({ error: 'Library ID required' });
            }

            const stories = await drizzleService.getStories({ libraryId });
            const mediaItems = await drizzleService.getMediaItems({ libraryId });
            const events = await drizzleService.getEvents({ libraryId });
            const messages = await drizzleService.getContactMessages({ libraryId });

            const stats = {
                totalStories: stories.length,
                publishedStories: stories.filter(s => s.isPublished).length,
                totalMedia: mediaItems.length,
                approvedMedia: mediaItems.filter(m => m.isApproved).length,
                totalEvents: events.length,
                upcomingEvents: events.filter(e => new Date(e.eventDate) > new Date()).length,
                totalMessages: messages.length,
                unreadMessages: messages.filter(m => !m.isRead).length
            };

            return res.status(200).json(stats);
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get(`${global_path}/admin/dashboard/analytics`, requireAuth, async (req, res) => {
        try {
            const libraryId = req.session.user?.libraryId;
            if (!libraryId) {
                return res.status(400).json({ error: 'Library ID required' });
            }

            const analytics = await drizzleService.getAnalytics({ libraryId });

            // Process analytics data for charts
            const last30Days = Array.from({ length: 30 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i);
                return date.toISOString().split('T')[0];
            }).reverse();

            const visitorData = last30Days.map(date => {
                const dayAnalytics = analytics.filter(a =>
                    a.date && new Date(a.date).toISOString().split('T')[0] === date
                );
                const totalViews = dayAnalytics.reduce((sum, a) => sum + (a.views || 0), 0);

                return {
                    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    visitors: totalViews,
                    uniqueVisitors: Math.floor(totalViews * 0.7) // Approximate unique visitors
                };
            });

            const contentData = [
                { name: 'Stories', views: analytics.filter(a => a.storyId).reduce((sum, a) => sum + (a.views || 0), 0), engagement: 75 },
                { name: 'Gallery', views: analytics.filter(a => a.pageType === 'gallery').reduce((sum, a) => sum + (a.views || 0), 0), engagement: 85 },
                { name: 'Library Profile', views: analytics.filter(a => a.pageType === 'library_profile').reduce((sum, a) => sum + (a.views || 0), 0), engagement: 65 }
            ];

            const engagementData = last30Days.slice(-7).map(date => ({
                date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                avgTimeSpent: Math.floor(Math.random() * 300) + 120, // Mock data for demo
                interactionRate: Math.floor(Math.random() * 40) + 60
            }));

            const topPerformers = {
                topStory: 'Featured Exhibition',
                topStoryViews: Math.max(...analytics.filter(a => a.storyId).map(a => a.views || 0), 0),
                topGallery: 'Main Collection',
                topGalleryViews: Math.max(...analytics.filter(a => a.pageType === 'gallery').map(a => a.views || 0), 0),
                avgTimeOnPage: '4:32',
                avgTimeIncrease: 12
            };

            return res.status(200).json({
                visitorData,
                contentData,
                engagementData,
                topPerformers
            });
        } catch (error) {
            console.error("Error fetching analytics:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get(`${global_path}/admin/dashboard/activity`, requireAuth, async (req, res) => {
        try {
            const libraryId = req.session.user?.libraryId;
            if (!libraryId) {
                return res.status(400).json({ error: 'Library ID required' });
            }

            const stories = await drizzleService.getStories({ libraryId, limit: 5 });
            const messages = await drizzleService.getContactMessages({ libraryId, limit: 5 });
            const events = await drizzleService.getEvents({ libraryId, limit: 5 });

            const recentActivity = [
                ...stories.map(s => ({
                    type: 'story',
                    title: `Story updated: ${s.title}`,
                    timestamp: s.updatedAt || s.createdAt,
                    status: s.isPublished ? 'published' : 'draft'
                })),
                ...messages.map(m => ({
                    type: 'message',
                    title: `New inquiry: ${m.subject}`,
                    timestamp: m.createdAt,
                    status: m.isRead ? 'read' : 'unread'
                })),
                ...events.map(e => ({
                    type: 'event',
                    title: `Event: ${e.title}`,
                    timestamp: e.createdAt,
                    status: e.isPublished ? 'published' : 'draft'
                }))
            ].sort((a, b) =>
                new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime()
            ).slice(0, 10);

            return res.status(200).json(recentActivity);
        } catch (error) {
            console.error("Error fetching recent activity:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Admin: Get all galleries
    app.get(`${global_path}/admin/galleries`, apiHandler(async (req, res) => {
        if (!req.session.user) {
            return res.status(403).json({ error: 'Unauthorized - not logged in' });
        }
        const galleries = await drizzleService.getGalleries();
        return res.status(200).json(galleries);
    }));

    // Delete Image Route
    app.delete(global_path + '/admin/upload/image/:publicId', requireAuth, apiHandler(async (req, res) => {
        const { publicId } = req.params;
        const { cloudinaryService } = await import("../../config/bucket-storage/cloudinary");

        if (!cloudinaryService.isReady()) {
            return res.status(503).json({ error: 'Cloudinary not configured' });
        }

        try {
            // Decode the public ID (it may be URL encoded)
            const decodedPublicId = decodeURIComponent(publicId);
            const success = await cloudinaryService.deleteImage(decodedPublicId);

            if (success) {
                return res.status(200).json({ success: true, message: 'Image deleted successfully' });
            } else {
                return res.status(404).json({ error: 'Image not found or already deleted' });
            }
        } catch (error) {
            console.error("Image deletion error:", error);
            return sendApiError(res, 500, 'Failed to delete image. Please try again or contact support.', ErrorCode.INTERNAL_ERROR);
        }
    }));
}
