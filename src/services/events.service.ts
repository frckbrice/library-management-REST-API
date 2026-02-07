/**
 * Events Service
 *
 * CRUD for events. Create/update support optional image upload. List and
 * delete are scoped by library or id; role checks for update/delete.
 *
 * @module src/services/events.service
 */

import drizzleService from './drizzle-services';
import { Event, InsertEvent } from '../../config/database/schema';
import { NotFoundError, AuthorizationError } from '../utils/errors';
import { logger } from '../middlewares/logger';
import { uploadImageToCloudinary } from '../routes/shared';

export interface CreateEventData extends Partial<InsertEvent> {
  imageUrl?: string | null;
}

export interface UpdateEventData extends Partial<InsertEvent> {
  imageUrl?: string | null;
}

export class EventsService {
  /** Creates an event for the given library; optional image upload to Cloudinary. */
  async createEvent(
    data: CreateEventData,
    libraryId: string,
    file?: Express.Multer.File
  ): Promise<Event> {
    if (!libraryId) {
      throw new Error('Library ID required');
    }

    // Handle event image upload
    let imageUrl = data.imageUrl || null;
    if (file) {
      try {
        imageUrl = await uploadImageToCloudinary(file, 'events');
      } catch (error) {
        throw new Error('Failed to upload event image');
      }
    }

    const eventData: InsertEvent = {
      ...data,
      libraryId,
      imageUrl,
      isApproved: false, // New events need approval
      createdAt: new Date(),
    } as InsertEvent;

    const event = await drizzleService.createEvent(eventData);
    logger.info('Event created', { eventId: event.id, libraryId });

    return event;
  }

  async updateEvent(
    eventId: string,
    data: UpdateEventData,
    userLibraryId: string,
    userRole: string,
    file?: Express.Multer.File
  ): Promise<Event> {
    const existingEvent = await drizzleService.getEvent(eventId);

    if (!existingEvent) {
      throw new NotFoundError('Event');
    }

    // Check ownership
    if (userRole === 'library_admin' && existingEvent.libraryId !== userLibraryId) {
      throw new AuthorizationError('You can only edit events for your library');
    }

    // Handle event image upload
    let imageUrl = data.imageUrl ?? existingEvent.imageUrl;
    if (file) {
      try {
        imageUrl = await uploadImageToCloudinary(file, 'events');
      } catch (error) {
        throw new Error('Failed to upload event image');
      }
    }

    const updateData: Partial<Event> = {
      ...data,
      imageUrl,
    };

    const updatedEvent = await drizzleService.updateEvent(eventId, updateData);
    if (!updatedEvent) {
      throw new Error('Failed to update event');
    }
    logger.info('Event updated', { eventId });

    return updatedEvent;
  }

  /** Lists events, optionally filtered by libraryId. */
  async getEvents(options?: { libraryId?: string }): Promise<Event[]> {
    return drizzleService.getEvents(options);
  }

  async getEvent(eventId: string): Promise<Event> {
    const event = await drizzleService.getEvent(eventId);

    if (!event) {
      throw new NotFoundError('Event');
    }

    return event;
  }

  /** Deletes an event by ID; throws NotFoundError if not found. */
  async deleteEvent(eventId: string): Promise<boolean> {
    const deleted = await drizzleService.deleteEvent(eventId);

    if (!deleted) {
      throw new NotFoundError('Event');
    }

    logger.info('Event deleted', { eventId });
    return true;
  }
}

export const eventsService = new EventsService();
