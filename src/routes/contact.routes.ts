import type { Express } from "express";
import drizzleService from "../../services/drizzle-services";
import { sendResponseEmail } from "../../services/email-service";
import { contactLimiter, emailLimiter } from '../../middlewares/rate-limiters';
import { jsonApiMiddleware, apiHandler } from "./shared";

export function registerContactRoutes(app: Express, global_path: string) {
    // Contact messages endpoints
    app.get(`${global_path}/contact-messages`, async (req, res) => {
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

    app.patch(`${global_path}/contact-messages/:id`, async (req, res) => {
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

    // Reply to a contact message
    app.post(`${global_path}/contact-messages/:id/reply`, emailLimiter, jsonApiMiddleware, apiHandler(async (req, res) => {
        if (!req.session.user || req.session.user.role !== 'library_admin') {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const messageId = req.params.id;
        const { subject, message } = req.body;

        if (!subject || !message) {
            return res.status(400).json({ error: "Subject and message are required" });
        }

        // Get the original message
        const originalMessage = await drizzleService.getContactMessage(messageId);
        if (!originalMessage || originalMessage.libraryId !== req.session.user.libraryId) {
            return res.status(404).json({ error: "Message not found" });
        }

        // Get library information
        const library = await drizzleService.getLibrary(req.session.user.libraryId!);
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
                respondedBy: req.session.user.id,
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
