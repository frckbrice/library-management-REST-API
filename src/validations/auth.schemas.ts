/**
 * Authentication Validation Schemas
 * 
 * Re-exports the login schema from the database schema to maintain
 * a single source of truth. All authentication validation should use
 * schemas from this file.
 * 
 * Usage:
 *   router.post('/auth/login', validate(loginSchema), handler);
 */
import { z } from 'zod';
import { loginSchema } from '../../config/database/schema';

// Re-export login schema from database schema (single source of truth)
export { loginSchema };
export type LoginInput = z.infer<typeof loginSchema>;
