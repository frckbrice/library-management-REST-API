/**
 * Contact Controller
 *
 * Contact form messages: list (filtered by library for admins), create, update,
 * and reply. Reply is restricted to library_admin role.
 *
 * @module src/controllers/contact.controller
 */

import { Request, Response } from 'express';
import { contactService } from '../services/contact.service';
import { AuthorizationError } from '../utils/errors';

export class ContactController {
  /**
   * Lists contact messages; when libraryId is present in session, filters by that library.
   * @param req - Express request; optional session.user.libraryId
   * @param res - Express response; sends JSON array of messages
   */
  async getContactMessages(req: Request, res: Response): Promise<void> {
    const libraryId = req.session.user?.libraryId;
    const messages = await contactService.getContactMessages(libraryId);
    res.status(200).json(messages);
  }

  /**
   * Creates a new contact form message from validated body.
   * @param req - Express request; body validated by contact schema
   * @param res - Express response; sends 201 and created message
   */
  async createContactMessage(req: Request, res: Response): Promise<void> {
    const message = await contactService.createContactMessage(req.body);
    res.status(201).json(message);
  }

  async updateContactMessage(req: Request, res: Response): Promise<void> {
    const messageId = req.params.id;
    const message = await contactService.updateContactMessage(messageId, req.body);
    res.status(200).json(message);
  }

  /**
   * Sends an email reply to a contact message and records the response. Restricted to library_admin.
   * @param req - Express request; params.id, body.subject, body.message; session user required
   * @param res - Express response; sends created message response
   */
  async replyToMessage(req: Request, res: Response): Promise<void> {
    if (!req.session.user || req.session.user.role !== 'library_admin') {
      throw new AuthorizationError('Unauthorized');
    }

    const messageId = req.params.id;
    const { subject, message } = req.body;
    const userId = req.session.user.id;
    const libraryId = req.session.user.libraryId!;

    const response = await contactService.replyToMessage(
      messageId,
      subject,
      message,
      userId,
      libraryId
    );

    res.json(response);
  }
}

export const contactController = new ContactController();
