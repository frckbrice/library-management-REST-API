/**
 * Contact Message Validation Schemas
 * 
 * These schemas extend the database insert schemas from config/database/schema.ts
 * to add API-specific validation rules. This follows DRY principles by using
 * the database schema as the single source of truth.
 * 
 * Usage:
 * - Use createContactMessageSchema for POST /api/v1/contact-messages
 * - Use replyContactMessageSchema for POST /api/v1/contact-messages/:id/reply
 * 
 * Example:
 *   router.post('/contact-messages', validate(createContactMessageSchema), handler);
 */
import { z } from 'zod';
import { insertContactMessageSchema } from '../../config/database/schema';

// Extends database schema with API-specific validation constraints
export const createContactMessageSchema = insertContactMessageSchema.extend({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(1, 'Message is required').max(5000),
});

// Schema for replying to contact messages (doesn't need full contact info)
export const replyContactMessageSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(1, 'Message is required').max(5000),
});

// TypeScript types inferred from schemas for type-safe request handling
export type CreateContactMessageInput = z.infer<typeof createContactMessageSchema>;
export type ReplyContactMessageInput = z.infer<typeof replyContactMessageSchema>;
