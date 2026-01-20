import type { Express } from "express";
import drizzleService from "../../services/drizzle-services";
import { upload, apiHandler, uploadImageToCloudinary } from "./shared";

export function registerEventsRoutes(app: Express, global_path: string) {
    app.post(`${global_path}/events`, upload.single('eventImage'), apiHandler(async (req, res) => {
        if (!req.session.user) {
            return res.status(403).json({ error: 'Unauthorized - not logged in' });
        }

        const libraryId = req.session.user.libraryId;
        if (!libraryId) {
            return res.status(400).json({ error: 'Library ID required' });
        }

        // Handle event image upload
        let imageUrl = req.body.imageUrl || null;
        if (req.file) {
            try {
                imageUrl = await uploadImageToCloudinary(req.file, 'events');
            } catch (error) {
                return res.status(500).json({ error: 'Failed to upload event image' });
            }
        }

        const eventData = {
            ...req.body,
            libraryId,
            imageUrl,
            isApproved: false, // New events need approval
            createdAt: new Date()
        };

        const event = await drizzleService.createEvent(eventData);
        return res.status(201).json(event);
    }));

    // Update event with image upload
    app.patch(`${global_path}/events/:id`, upload.single('eventImage'), apiHandler(async (req, res) => {
        if (!req.session.user) {
            return res.status(403).json({ error: 'Unauthorized - not logged in' });
        }

        const eventId = req.params.id;
        const existingEvent = await drizzleService.getEvent(eventId);

        if (!existingEvent) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Check ownership
        if (req.session.user.role === 'library_admin' && existingEvent.libraryId !== req.session.user.libraryId) {
            return res.status(403).json({ error: 'Unauthorized - you can only edit events for your library' });
        }

        // Handle event image upload
        let imageUrl = req.body.imageUrl || existingEvent.imageUrl;
        if (req.file) {
            try {
                imageUrl = await uploadImageToCloudinary(req.file, 'events');
            } catch (error) {
                return res.status(500).json({ error: 'Failed to upload event image' });
            }
        }

        const updateData = {
            ...req.body,
            imageUrl,
            updatedAt: new Date()
        };

        const updatedEvent = await drizzleService.updateEvent(eventId, updateData);
        return res.status(200).json(updatedEvent);
    }));

    // Events endpoints
    app.get(`${global_path}/events`, async (req, res) => {
        try {
            const libraryId = req.session.user?.libraryId;
            const options = libraryId ? { libraryId } : {};

            const events = await drizzleService.getEvents(options);
            return res.status(200).json(events);
        } catch (error) {
            console.error("Error fetching events:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.delete(`${global_path}/events/:id`, async (req, res) => {
        try {
            const eventId = req.params.id;
            const deleted = await drizzleService.deleteEvent(eventId);

            if (!deleted) {
                return res.status(404).json({ error: 'Event not found' });
            }

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error("Error deleting event:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
}
