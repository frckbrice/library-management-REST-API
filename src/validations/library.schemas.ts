/**
 * Library Validation Schemas
 * 
 * Extends database insert schemas with API-specific validation rules.
 * Most fields are optional to allow flexible library creation/updates.
 * 
 * Usage:
 * - createLibrarySchema: POST /api/v1/libraries (super_admin only)
 * - updateLibrarySchema: PATCH /api/v1/libraries/:id
 * 
 * Example:
 *   router.post('/libraries', requireSuperAdmin, validate(createLibrarySchema), handler);
 */
import { z } from 'zod';
import { insertLibrarySchema } from '../../config/database/schema';

// Extends database schema with API-specific validation and makes fields optional
export const createLibrarySchema = insertLibrarySchema
  .extend({
    name: z.string().min(1, 'Name is required').max(200),
    description: z.string().min(1).optional(),
    website: z.string().url().optional(),
    logoUrl: z.string().url().optional().nullable(),
    featuredImageUrl: z.string().url().optional().nullable(),
  })
  .partial(); // Make most fields optional for API flexibility

// Update schema allows partial updates
export const updateLibrarySchema = createLibrarySchema.partial();

// TypeScript types for type-safe request handling
export type CreateLibraryInput = z.infer<typeof createLibrarySchema>;
export type UpdateLibraryInput = z.infer<typeof updateLibrarySchema>;
