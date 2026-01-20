import type { Express } from "express";
import drizzleService from "../../services/drizzle-services";
import { upload, apiHandler, uploadImageToCloudinary } from "./shared";

export function registerMediaRoutes(app: Express, global_path: string) {
    // Media endpoints
    app.get(`${global_path}/media-items`, async (req, res) => {
        try {
            // Extract query parameters
            const libraryId = req.query.libraryId ? String(req.query.libraryId) : undefined;
            const galleryId = req.query.galleryId ? String(req.query.galleryId) : undefined;

            // Handle boolean parameters properly - undefined if not provided, explicit boolean if provided
            let approved = undefined;
            if (req.query.approved !== undefined) {
                approved = req.query.approved === 'true';
            }

            const mediaType = req.query.mediaType ? String(req.query.mediaType) : undefined;
            const tags = req.query.tag ? Array.isArray(req.query.tag) ? req.query.tag as string[] : [req.query.tag as string] : undefined;
            const limit = req.query.limit ? Number(req.query.limit) : undefined;
            const offset = req.query.offset ? Number(req.query.offset) : undefined;

            // Pass parameters to storage method with appropriate naming
            const media = await drizzleService.getMediaItems({
                libraryId,
                galleryId,
                mediaType,
                tags,
                limit,
                offset,
                approved // Fixed to use the correct parameter name for the storage interface
            });

            return res.status(200).json(media);
        } catch (error) {
            console.error("Error fetching media:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Get individual media item
    app.get(`${global_path}/media-items/:id`, async (req, res) => {
        try {
            const mediaId = req.params.id;
            const mediaItem = await drizzleService.getMediaItem(mediaId);

            if (!mediaItem) {
                return res.status(404).json({ error: 'Media item not found' });
            }

            return res.status(200).json(mediaItem);
        } catch (error) {
            console.error(`Error fetching media item with ID ${req.params.id}:`, error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.post(`${global_path}/media-items`, upload.single('mediaFile'), apiHandler(async (req, res) => {
        if (!req.session.user) {
            return res.status(403).json({ error: 'Unauthorized - not logged in' });
        }

        const libraryId = req.session.user.libraryId;
        if (!libraryId) {
            return res.status(400).json({ error: 'Library ID required' });
        }

        // Handle media file upload
        let url = req.body.url || null;
        if (req.file) {
            try {
                url = await uploadImageToCloudinary(req.file, 'media');
            } catch (error) {
                return res.status(500).json({ error: 'Failed to upload media file' });
            }
        }

        if (!url) {
            return res.status(400).json({ error: 'Media URL or file is required' });
        }

        const mediaData = {
            ...req.body,
            libraryId,
            url,
            isApproved: false, // New media needs approval
            createdAt: new Date()
        };

        const mediaItem = await drizzleService.createMediaItem(mediaData);
        return res.status(201).json(mediaItem);
    }));

    // Update media item with image upload
    app.patch(`${global_path}/media-items/:id`, upload.single('mediaFile'), apiHandler(async (req, res) => {
        if (!req.session.user) {
            return res.status(403).json({ error: 'Unauthorized - not logged in' });
        }

        const mediaId = req.params.id;
        const existingMedia = await drizzleService.getMediaItem(mediaId);

        if (!existingMedia) {
            return res.status(404).json({ error: 'Media item not found' });
        }

        // Check ownership
        if (req.session.user.role === 'library_admin' && existingMedia.libraryId !== req.session.user.libraryId) {
            return res.status(403).json({ error: 'Unauthorized - you can only edit media for your library' });
        }

        // Handle media file upload
        let url = req.body.url || existingMedia.url;
        if (req.file) {
            try {
                url = await uploadImageToCloudinary(req.file, 'media');
            } catch (error) {
                return res.status(500).json({ error: 'Failed to upload media file' });
            }
        }

        const updateData = {
            ...req.body,
            url,
            updatedAt: new Date()
        };

        const updatedMedia = await drizzleService.updateMediaItem(mediaId, updateData);
        return res.status(200).json(updatedMedia);
    }));

    // Admin: Get all unique media tags
    app.get(`${global_path}/admin/media/tags`, apiHandler(async (req, res) => {
        if (!req.session.user) {
            return res.status(403).json({ error: 'Unauthorized - not logged in' });
        }
        const mediaItems = await drizzleService.getMediaItems();
        const allTags = new Set<string>();
        mediaItems.forEach(item => {
            if (item.tags && Array.isArray(item.tags)) {
                item.tags.forEach(tag => allTags.add(tag));
            }
        });
        const sortedTags = Array.from(allTags).sort();
        return res.status(200).json(sortedTags);
    }));
}
