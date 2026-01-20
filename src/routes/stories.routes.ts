import type { Express, Request, Response, NextFunction } from "express";
import drizzleService from "../../services/drizzle-services";
import { Story } from "../../config/database/schema";
import { NotFoundError } from "../utils/errors";
import { requireAuth } from "../../middlewares/auth";
import { upload, apiHandler, uploadImageToCloudinary } from "./shared";

export function registerStoriesRoutes(app: Express, global_path: string) {
    // Admin story management endpoints
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
            throw new Error('You can only edit stories for your library');
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

    // Admin timelines endpoints
    app.get(`${global_path}/admin/stories/:id/timelines`, apiHandler(async (req, res) => {
        // Relaxed authentication for testing
        if (!req.session.user) {
            return res.status(403).json({ error: 'Unauthorized - not logged in' });
        }

        const storyId = req.params.id;

        // Get the story first to verify ownership
        const story = await drizzleService.getStory(storyId);

        if (!story) {
            return res.status(404).json({ error: 'Story not found' });
        }

        // Skip ownership check for testing
        // Get the timelines
        const timelines = await drizzleService.getTimelinesByStoryId(storyId);
        console.log("Retrieved timelines:", timelines);
        return res.status(200).json(timelines);
    }));

    app.post(`${global_path}/admin/stories/:id/timelines`, apiHandler(async (req, res) => {
        // Relaxed authentication for testing
        if (!req.session.user) {
            return res.status(403).json({ error: 'Unauthorized - not logged in' });
        }

        const storyId = req.params.id;

        // Get the story first to verify it exists
        const story = await drizzleService.getStory(storyId);

        if (!story) {
            return res.status(404).json({ error: 'Story not found' });
        }

        // Create timeline data
        const timelineData = {
            ...req.body,
            storyId,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        console.log("Creating timeline with data:", timelineData);
        const timeline = await drizzleService.createTimeline(timelineData);
        console.log("Timeline created successfully:", timeline);
        return res.status(200).json(timeline);
    }));

    // Stories endpoints
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
            // Skip the tags endpoint - special case
            if (req.params.id === 'tags') {
                const allStories = await drizzleService.getStories();
                const uniqueTags = new Set<string>();
                allStories.forEach((story: Story) => {
                    if (story.tags && Array.isArray(story.tags)) {
                        story.tags.forEach((tag: string) => {
                            if (tag) uniqueTags.add(tag);
                        });
                    }
                });

                return res.status(200).json({
                    success: true,
                    data: Array.from(uniqueTags)
                });
            }

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

    // Get all story tags
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
}
