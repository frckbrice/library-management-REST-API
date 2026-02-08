/**
 * Environment Configuration
 * 
 * Validates and provides type-safe access to environment variables.
 * All environment variables are validated on application startup using Zod.
 * 
 * Usage:
 *   import { env } from './config/env';
 *   const port = env.PORT;
 *   const isProduction = env.NODE_ENV === 'production';
 * 
 * Benefits:
 * - Type-safe environment variable access
 * - Validation on startup (fails fast if invalid)
 * - Default values for optional variables
 * - Clear error messages for missing/invalid variables
 */
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Environment variable schema with validation rules
 * - Required variables will cause startup failure if missing
 * - Optional variables have defaults or are marked optional
 * - Type transformations (e.g., PORT to number) are handled automatically
 */
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).default('5500'),

    // Database - required for app and migrations/seed
    DATABASE_PRO_URL: z.string().url(),
    DATABASE_URL: z.string().url().optional(),
    DATAAPI_URL: z.string().url().optional(),

    // Session - required for security
    SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),

    // Cloudinary - optional (only needed for file uploads)
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),

    // Email - optional (only needed for email functionality)
    GMAIL_USER: z.string().email().optional(),
    GMAIL_PASS: z.string().optional(),
    /** Contact email shown in API docs (e.g. Swagger). */
    GMAIL_APP_SUPPORT: z.string().email().optional(),

    // CORS - defaults to common development origins
    ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),
});

type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables on startup
 * Throws an error with detailed messages if validation fails
 */
function validateEnv(): Env {
    try {
        return envSchema.parse(process.env);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const missingVars = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('\n');
            throw new Error(`Environment validation failed:\n${missingVars}`);
        }
        throw error;
    }
}

// Validated and type-safe environment variables
export const env = validateEnv();
