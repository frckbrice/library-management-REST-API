/**
 * Media Item Validation Schemas
 * 
 * Extends database insert schemas with API-specific validation rules.
 * URL is optional since media can be uploaded via file upload.
 * 
 * Usage:
 * - createMediaItemSchema: POST /api/v1/media-items
 * - updateMediaItemSchema: PATCH /api/v1/media-items/:id
 * - mediaQuerySchema: GET /api/v1/media-items (query parameters)
 * 
 * Example:
 *   router.post('/media-items', requireAuth, upload.single('mediaFile'), 
 *               validate(createMediaItemSchema), handler);
 */
import { z } from 'zod';
import { insertMediaItemSchema } from '../../config/database/schema';

// Extends database schema with API-specific validation
export const createMediaItemSchema = insertMediaItemSchema.extend({
  title: z.string().min(1, 'Title is required').max(200),
  url: z.string().url().optional(), // URL optional if file upload provided
  tags: z.array(z.string()).optional().default([]),
});

// Update schema allows partial updates
export const updateMediaItemSchema = createMediaItemSchema.partial();

// Query parameter schema for filtering media items
export const mediaQuerySchema = z.object({
  libraryId: z.string().optional(),
  galleryId: z.string().optional(),
  approved: z.string().transform((val) => val === 'true').optional(),
  mediaType: z.enum(['image', 'video', 'audio']).optional(),
  tag: z.union([z.string(), z.array(z.string())]).optional(),
  limit: z.string().transform(Number).optional(),
  offset: z.string().transform(Number).optional(),
});

// TypeScript types for type-safe request handling
export type CreateMediaItemInput = z.infer<typeof createMediaItemSchema>;
export type UpdateMediaItemInput = z.infer<typeof updateMediaItemSchema>;
export type MediaQueryInput = z.infer<typeof mediaQuerySchema>;
