/**
 * Stories Routes
 *
 * Public: GET stories (list), GET story by id, GET tags, GET timelines by story.
 * Admin: POST/PUT/DELETE stories, POST timeline. Uses requireAuth and optional
 * file upload for featured image.
 *
 * @module src/routes/stories.routes
 */

import type { Express, Request, Response, NextFunction } from "express";
import drizzleService from "../services/drizzle-services";
import { NotFoundError, AuthorizationError } from "../utils/errors";
import { requireAuth } from "../middlewares/auth";
import { upload, apiHandler, uploadImageToCloudinary } from "./shared";

/**
 * Registers stories routes: public list/get/tags/timelines; admin create/update/delete stories and timelines (requireAuth, optional file upload).
 * @param app - Express application
 * @param global_path - Base path (e.g. /api/v1)
 */
export function registerStoriesRoutes(app: Express, global_path: string) {
    app.post(`${global_path}/admin/stories`, requireAuth, upload.single('featuredImage'), apiHandler(async (req, res) => {
        const libraryId = req.session.user!.libraryId;

        // Handle featured image upload
        let featuredImageUrl = req.body.featuredImageUrl || null;
        if (req.file) {
            featuredImageUrl = await uploadImageToCloudinary(req.file, 'stories');
        }

        // Create story with library ID from session user
        const storyData = {
            ...req.body,
            libraryId,
            featuredImageUrl,
            isApproved: false, // New stories need approval
            isPublished: req.body.isPublished || false,
            isFeatured: false, // Only super admin can feature stories
            createdAt: new Date()
        };

        const story = await drizzleService.createStory(storyData);
        return res.status(201).json({
            success: true,
            data: story
        });
    }));

    // Admin story update endpoint
    app.patch(`${global_path}/admin/stories/:id`, requireAuth, upload.single('featuredImage'), apiHandler(async (req, res) => {
        const storyId = req.params.id;
        const existingStory = await drizzleService.getStory(storyId);

        if (!existingStory) {
            throw new NotFoundError('Story');
        }

        const libraryId = req.session.user!.libraryId;

        // Check ownership for library admins
        if (req.session.user!.role === 'library_admin' && existingStory.libraryId !== libraryId) {
            throw new AuthorizationError('You can only edit stories for your library');
        }

        // Handle featured image upload
        let featuredImageUrl = req.body.featuredImageUrl || existingStory.featuredImageUrl;
        if (req.file) {
            featuredImageUrl = await uploadImageToCloudinary(req.file, 'stories');
        }

        // Preserve approval status - only super admin can change this
        const updateData = {
            ...req.body,
            featuredImageUrl,
            isApproved: existingStory.isApproved, // Preserve approval status
            updatedAt: new Date()
        };

        const updatedStory = await drizzleService.updateStory(storyId, updateData);
        return res.status(200).json({
            success: true,
            data: updatedStory
        });
    }));

    // Admin get single story endpoint
    app.get(`${global_path}/admin/stories/:id`, requireAuth, apiHandler(async (req, res) => {
        const storyId = req.params.id;
        const story = await drizzleService.getStory(storyId);

        if (!story) {
            throw new NotFoundError('Story');
        }

        return res.status(200).json({
            success: true,
            data: story
        });
    }));

    // Admin delete story endpoint
    app.delete(`${global_path}/admin/stories/:id`, requireAuth, apiHandler(async (req, res) => {
        const storyId = req.params.id;
        const existingStory = await drizzleService.getStory(storyId);

        if (!existingStory) {
            throw new NotFoundError('Story');
        }

        const libraryId = req.session!.user!.libraryId;
        if (req.session!.user!.role === 'library_admin' && existingStory.libraryId !== libraryId) {
            throw new AuthorizationError('You can only delete stories for your library');
        }

        const deleted = await drizzleService.deleteStory(storyId);
        if (!deleted) {
            throw new NotFoundError('Story');
        }

        return res.status(204).send();
    }));

    // Admin timelines endpoints
    app.get(`${global_path}/admin/stories/:id/timelines`, requireAuth, apiHandler(async (req, res) => {
        const storyId = req.params.id;

        const story = await drizzleService.getStory(storyId);

        if (!story) {
            throw new NotFoundError('Story');
        }

        // Verify ownership for library admins
        const libraryId = req.session!.user!.libraryId;
        if (req.session!.user!.role === 'library_admin' && story.libraryId !== libraryId) {
            throw new AuthorizationError('You can only access timelines for stories in your library');
        }

        // Get the timelines
        const timelines = await drizzleService.getTimelinesByStoryId(storyId);
        return res.status(200).json(timelines);
    }));

    app.post(`${global_path}/admin/stories/:id/timelines`, requireAuth, apiHandler(async (req, res) => {
        const storyId = req.params.id;

        const story = await drizzleService.getStory(storyId);

        if (!story) {
            throw new NotFoundError('Story');
        }

        // Verify ownership for library admins
        const libraryId = req.session!.user!.libraryId;
        if (req.session!.user!.role === 'library_admin' && story.libraryId !== libraryId) {
            throw new AuthorizationError('You can only add timelines to stories in your library');
        }

        // Create timeline data
        const timelineData = {
            ...req.body,
            storyId,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const timeline = await drizzleService.createTimeline(timelineData);
        return res.status(201).json(timeline);
    }));

    // Stories endpoints - specific routes before parametric to avoid /stories/tags matching :id
    app.get(`${global_path}/stories/tags`, async (req, res) => {
        try {
            const stories = await drizzleService.getStories({ published: true, approved: true });
            const allTags = new Set<string>();

            stories.forEach(story => {
                if (story.tags && Array.isArray(story.tags)) {
                    story.tags.forEach(tag => allTags.add(tag));
                }
            });

            const sortedTags = Array.from(allTags).sort();
            return res.status(200).json(sortedTags);
        } catch (error) {
            console.error("Error fetching story tags:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get(`${global_path}/stories`, async (req, res) => {
        try {
            // Extract query parameters
            const libraryId = req.query.libraryId ? String(req.query.libraryId) : undefined;

            // Handle boolean parameters properly - undefined if not provided, explicit boolean if provided
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

            const tags = req.query.tag ? Array.isArray(req.query.tag) ? req.query.tag as string[] : [req.query.tag as string] : undefined;
            const limit = req.query.limit ? Number(req.query.limit) : undefined;
            const offset = req.query.offset ? Number(req.query.offset) : undefined;

            // Pass parameters to storage method with appropriate naming
            const stories = await drizzleService.getStories({
                libraryId,
                published,
                approved, // Fixed to use the correct parameter name for the storage interface
                featured,
                tags,
                limit,
                offset
            });

            return res.status(200).json(stories);
        } catch (error) {
            console.error("Error fetching stories:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Get individual story
    app.get(`${global_path}/stories/:id`, async (req, res, next) => {
        try {
            const storyId = req.params.id;
            const story = await drizzleService.getStory(storyId);

            if (!story) {
                throw new NotFoundError('Story');
            }

            return res.status(200).json({
                success: true,
                data: story
            });
        } catch (error) {
            next(error);
        }
    });
}
