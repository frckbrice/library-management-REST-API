/**
 * Contact Service
 *
 * Contact messages: list (optional library filter), create, update, reply.
 * Reply sends email via sendResponseEmail and records the reply.
 *
 * @module src/services/contact.service
 */

import drizzleService from './drizzle-services';
import { sendResponseEmail } from './email-service';
import { ContactMessage, InsertContactMessage } from '../../config/database/schema';
import { NotFoundError, AuthorizationError } from '../utils/errors';
import { logger } from '../middlewares/logger';

export class ContactService {
  /** Lists contact messages, optionally filtered by libraryId. */
  async getContactMessages(libraryId?: string): Promise<ContactMessage[]> {
    const options = libraryId ? { libraryId } : {};
    return drizzleService.getContactMessages(options);
  }

  async createContactMessage(data: InsertContactMessage): Promise<ContactMessage> {
    const message = await drizzleService.createContactMessage(data);
    logger.info('Contact message created', { messageId: message.id });
    return message;
  }

  /** Updates a contact message by ID; throws NotFoundError if not found. */
  async updateContactMessage(
    messageId: string,
    data: Partial<ContactMessage>
  ): Promise<ContactMessage> {
    const updatedMessage = await drizzleService.updateContactMessage(messageId, data);

    if (!updatedMessage) {
      throw new NotFoundError('Contact message');
    }

    logger.info('Contact message updated', { messageId });
    return updatedMessage;
  }

  /** Gets a contact message by ID; throws NotFoundError if not found. */
  async getContactMessage(messageId: string): Promise<ContactMessage> {
    const message = await drizzleService.getContactMessage(messageId);

    if (!message) {
      throw new NotFoundError('Contact message');
    }

    return message;
  }

  /** Sends reply email, creates message response record, and marks message responded; throws if message/library not found or email fails. */
  async replyToMessage(
    messageId: string,
    subject: string,
    message: string,
    userId: string,
    libraryId: string
  ) {
    if (!subject || !message) {
      throw new Error('Subject and message are required');
    }

    // Get the original message
    const originalMessage = await drizzleService.getContactMessage(messageId);
    if (!originalMessage || originalMessage.libraryId !== libraryId) {
      throw new NotFoundError('Message');
    }

    // Get library information
    const library = await drizzleService.getLibrary(libraryId);
    if (!library) {
      throw new NotFoundError('Library');
    }

    // Send email response to visitor
    const emailSent = await sendResponseEmail({
      visitorEmail: originalMessage.email,
      visitorName: originalMessage.name,
      originalSubject: originalMessage.subject,
      responseSubject: subject,
      responseMessage: message,
      libraryName: library.name,
      libraryEmail: 'noreply@library.com',
    });

    if (!emailSent) {
      throw new Error('Failed to send email response');
    }

    // Create message response record
    const response = await drizzleService.createMessageResponse({
      contactMessageId: messageId,
      respondedBy: userId,
      subject,
      message,
    });

    // Update contact message status
    await drizzleService.updateContactMessage(messageId, {
      responseStatus: 'responded',
      isRead: true,
    });

    logger.info('Contact message replied', { messageId });
    return response;
  }
}

export const contactService = new ContactService();
