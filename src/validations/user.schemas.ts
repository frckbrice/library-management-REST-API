/**
 * User Validation Schemas
 * 
 * Extends database insert schemas with API-specific validation rules.
 * Password requirements are stricter than database constraints for security.
 * 
 * Usage:
 * - createUserSchema: POST /api/v1/superadmin/users
 * - updateUserSchema: PATCH /api/v1/superadmin/users/:id
 * - resetPasswordSchema: POST /api/v1/superadmin/users/:id/reset-password
 * 
 * Example:
 *   router.post('/superadmin/users', requireSuperAdmin, validate(createUserSchema), handler);
 */
import { z } from 'zod';
import { insertUserSchema } from '../../config/database/schema';

// Extends database schema with stronger password requirements and validation
export const createUserSchema = insertUserSchema.extend({
  password: z.string().min(8, 'Password must be at least 8 characters'), // Stronger than DB requirement
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(1, 'Full name is required').max(100),
});

// Update schema excludes password (use resetPasswordSchema for password changes)
export const updateUserSchema = createUserSchema.partial().omit({ password: true });

// Schema for password reset (separate from user update)
export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// TypeScript types for type-safe request handling
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
