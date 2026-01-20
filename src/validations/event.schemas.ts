/**
 * Event Validation Schemas
 * 
 * Extends database insert schemas with API-specific validation rules.
 * Event date can be provided as ISO string or Date object.
 * 
 * Usage:
 * - createEventSchema: POST /api/v1/events
 * - updateEventSchema: PATCH /api/v1/events/:id
 * 
 * Example:
 *   router.post('/events', requireAuth, upload.single('eventImage'),
 *               validate(createEventSchema), handler);
 */
import { z } from 'zod';
import { insertEventSchema } from '../../config/database/schema';

// Extends database schema with API-specific validation
export const createEventSchema = insertEventSchema.extend({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1).optional(),
  eventDate: z.string().datetime().or(z.date()), // Accepts ISO string or Date
  location: z.string().min(1).optional(),
  imageUrl: z.string().url().optional().nullable(),
});

// Update schema allows partial updates
export const updateEventSchema = createEventSchema.partial();

// TypeScript types for type-safe request handling
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
