/**
 * Contact Routes
 *
 * Contact form submit (rate-limited) and admin: list messages, update, reply.
 * Reply uses email limiter and requireLibraryAdmin.
 *
 * @module src/routes/contact.routes
 */

import type { Express } from "express";
import drizzleService from "../services/drizzle-services";
import { sendResponseEmail } from "../services/email-service";
import { contactLimiter, emailLimiter } from '../middlewares/rate-limiters';
import { requireAuth, requireLibraryAdmin } from "../middlewares/auth";
import { apiHandler } from "./shared";

/**
 * Registers contact routes: list/get/patch/delete messages (admin), POST message (public, rate-limited), POST reply (library admin, email rate-limited).
 * @param app - Express application
 * @param global_path - Base path (e.g. /api/v1)
 */
export function registerContactRoutes(app: Express, global_path: string) {
    app.get(`${global_path}/contact-messages`, requireAuth, requireLibraryAdmin, async (req, res) => {
        try {
            const libraryId = req.session.user?.libraryId;
            const options = libraryId ? { libraryId } : {};

            const messages = await drizzleService.getContactMessages(options);
            return res.status(200).json(messages);
        } catch (error) {
            console.error("Error fetching contact messages:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.post(`${global_path}/contact-messages`, contactLimiter, async (req, res) => {
        try {
            const message = await drizzleService.createContactMessage(req.body);
            return res.status(201).json(message);
        } catch (error) {
            console.error("Error creating contact message:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get(`${global_path}/contact-messages/:id`, requireAuth, requireLibraryAdmin, async (req, res) => {
        try {
            const messageId = req.params.id;
            const message = await drizzleService.getContactMessage(messageId);

            if (!message || (req.session.user?.libraryId && message.libraryId !== req.session.user.libraryId)) {
                return res.status(404).json({ error: 'Contact message not found' });
            }

            return res.status(200).json(message);
        } catch (error) {
            console.error("Error fetching contact message:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.patch(`${global_path}/contact-messages/:id`, requireAuth, requireLibraryAdmin, async (req, res) => {
        try {
            const messageId = req.params.id;
            const updatedMessage = await drizzleService.updateContactMessage(messageId, req.body);

            if (!updatedMessage) {
                return res.status(404).json({ error: 'Contact message not found' });
            }

            return res.status(200).json(updatedMessage);
        } catch (error) {
            console.error("Error updating contact message:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.delete(`${global_path}/contact-messages/:id`, requireAuth, requireLibraryAdmin, async (req, res) => {
        try {
            const messageId = req.params.id;
            const message = await drizzleService.getContactMessage(messageId);

            if (!message || (req.session.user?.libraryId && message.libraryId !== req.session.user.libraryId)) {
                return res.status(404).json({ error: 'Contact message not found' });
            }

            const deleted = await drizzleService.deleteContactMessage(messageId);
            if (!deleted) {
                return res.status(404).json({ error: 'Contact message not found' });
            }

            return res.status(204).send();
        } catch (error) {
            console.error("Error deleting contact message:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Reply to a contact message
    app.post(`${global_path}/contact-messages/:id/reply`, requireAuth, requireLibraryAdmin, emailLimiter, apiHandler(async (req, res) => {
        const messageId = req.params.id;
        const { subject, message } = req.body;

        if (!subject || !message) {
            return res.status(400).json({ error: "Subject and message are required" });
        }

        // Get the original message
        const originalMessage = await drizzleService.getContactMessage(messageId);
        if (!originalMessage || originalMessage.libraryId !== req.session!.user!.libraryId) {
            return res.status(404).json({ error: "Message not found" });
        }

        // Get library information
        const libraryId = req.session?.user?.libraryId;
        if (!libraryId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const library = await drizzleService.getLibrary(libraryId);
        if (!library) {
            return res.status(404).json({ error: "Library not found" });
        }

        try {
            // Send email response to visitor
            const emailSent = await sendResponseEmail({
                visitorEmail: originalMessage.email,
                visitorName: originalMessage.name,
                originalSubject: originalMessage.subject,
                responseSubject: subject,
                responseMessage: message,
                libraryName: library.name,
                libraryEmail: "noreply@library.com"
            });

            if (!emailSent) {
                return res.status(500).json({ error: "Failed to send email response" });
            }

            // Create message response record
            const response = await drizzleService.createMessageResponse({
                contactMessageId: messageId,
                respondedBy: req.session!.user!.id,
                subject,
                message
            });

            // Update contact message status
            await drizzleService.updateContactMessage(messageId, {
                responseStatus: 'responded',
                isRead: true
            });

            res.json(response);
        } catch (error) {
            console.error('Error sending reply:', error);
            res.status(500).json({ error: "Failed to send reply" });
        }
    }));
}
