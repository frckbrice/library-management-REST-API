/**
 * Events Controller
 *
 * CRUD for events. Create/update require authenticated user with libraryId;
 * list and delete are scoped by session or params as appropriate.
 *
 * @module src/controllers/events.controller
 */

import { Request, Response } from 'express';
import { eventsService } from '../services/events.service';
import { AuthorizationError } from '../utils/errors';

export class EventsController {
  /**
   * Creates a new event for the session user's library; optional event image upload.
   * @param req - Express request; body + optional req.file for image
   * @param res - Express response; sends 201 and created event
   */
  async createEvent(req: Request, res: Response): Promise<void> {
    if (!req.session.user) {
      throw new AuthorizationError('Unauthorized - not logged in');
    }
    const libraryId = req.session.user.libraryId;
    if (!libraryId) {
      throw new AuthorizationError('Library context required');
    }
    const event = await eventsService.createEvent(req.body, libraryId, req.file);

    res.status(201).json(event);
  }

  /**
   * Updates an event by ID; enforces library ownership for library_admin. Optional image upload.
   * @param req - Express request; params.id, body, optional req.file
   * @param res - Express response; sends updated event
   */
  async updateEvent(req: Request, res: Response): Promise<void> {
    if (!req.session.user) {
      throw new AuthorizationError('Unauthorized - not logged in');
    }
    const libraryId = req.session.user.libraryId;
    if (!libraryId) {
      throw new AuthorizationError('Library context required');
    }
    const eventId = req.params.id;
    const role = req.session.user.role;

    const updatedEvent = await eventsService.updateEvent(
      eventId,
      req.body,
      libraryId,
      role,
      req.file
    );

    res.status(200).json(updatedEvent);
  }

  async getEvents(req: Request, res: Response): Promise<void> {
    const libraryId = req.session.user?.libraryId;
    const options = libraryId ? { libraryId } : {};

    const events = await eventsService.getEvents(options);
    res.status(200).json(events);
  }

  /**
   * Deletes an event by ID.
   * @param req - Express request; params.id
   * @param res - Express response; sends success
   */
  async deleteEvent(req: Request, res: Response): Promise<void> {
    const eventId = req.params.id;
    await eventsService.deleteEvent(eventId);
    res.status(200).json({ success: true });
  }
}

export const eventsController = new EventsController();
