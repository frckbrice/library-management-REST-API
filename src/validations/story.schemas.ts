/**
 * Story Validation Schemas
 * 
 * Extends database insert schemas with API-specific validation rules.
 * The createStorySchema omits 'summary' (not required in API) and adds
 * stricter validation for title, content, and featuredImageUrl.
 * 
 * Usage:
 * - createStorySchema: POST /api/v1/admin/stories
 * - updateStorySchema: PATCH /api/v1/admin/stories/:id
 * - storyQuerySchema: GET /api/v1/stories (query parameters)
 * 
 * Example:
 *   router.post('/admin/stories', validate(createStorySchema), handler);
 *   router.get('/stories', validateQuery(storyQuerySchema), handler);
 */
import { z } from 'zod';
import { insertStorySchema } from '../../config/database/schema';

// Base schema for creating stories (object only - for partial we need this before refine)
const createStorySchemaBase = insertStorySchema
  .omit({ summary: true }) // summary not required in API
  .extend({
    title: z.string().min(1, 'Title is required').max(200),
    content: z.string().min(1, 'Content is required'),
    featuredImageUrl: z.string().url().optional().nullable(),
    tags: z.array(z.string()).optional().default([]),
  });

// Create schema with refinement (ZodEffects - no .partial())
export const createStorySchema = createStorySchemaBase.refine(
  (data) => !data.libraryId || z.string().uuid().safeParse(data.libraryId).success,
  { message: 'Library ID must be a valid UUID', path: ['libraryId'] }
);

// Update schema allows partial updates (from base object schema)
export const updateStorySchema = createStorySchemaBase.partial();

// Query parameter schema for filtering stories
export const storyQuerySchema = z.object({
  libraryId: z.string().optional(),
  published: z.string().transform((val) => val === 'true').optional(),
  approved: z.string().transform((val) => val === 'true').optional(),
  featured: z.string().transform((val) => val === 'true').optional(),
  tag: z.union([z.string(), z.array(z.string())]).optional(),
  limit: z.string().transform(Number).optional(),
  offset: z.string().transform(Number).optional(),
});

// TypeScript types for type-safe request handling
export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type UpdateStoryInput = z.infer<typeof updateStorySchema>;
export type StoryQueryInput = z.infer<typeof storyQuerySchema>;
