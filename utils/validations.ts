/**
 * Validation Middleware
 * 
 * Provides reusable middleware functions for validating request data using Zod schemas.
 * These middleware functions automatically format validation errors and throw
 * ValidationError instances that are handled by the error handler middleware.
 * 
 * Usage:
 *   import { validate, validateQuery, validateParams } from './utils/validations';
 *   import { createStorySchema } from './src/validations/story.schemas';
 * 
 *   router.post('/stories', validate(createStorySchema), handler);
 *   router.get('/stories', validateQuery(storyQuerySchema), handler);
 *   router.get('/stories/:id', validateParams(z.object({ id: z.string().uuid() })), handler);
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../src/utils/errors';

// UUID validation middleware
interface UUIDRequest extends Request {
    params: {
        id: string;
        [key: string]: string;
    };
}

/**
 * Validates UUID format in route parameters
 * Returns 400 error if UUID format is invalid
 */
export const validateUUID = (req: UUIDRequest, res: Response, next: NextFunction): Response | void => {
    const { id } = req.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        return res.status(400).json({ error: 'Invalid UUID format' });
    }
    next();
};

/**
 * Validates request body using a Zod schema
 * @param schema - Zod schema to validate against
 * @returns Middleware function that validates req.body
 * @throws ValidationError if validation fails
 * 
 * Example:
 *   router.post('/stories', validate(createStorySchema), handler);
 */
export const validate = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = error.errors.reduce((acc, err) => {
                    const path = err.path.join('.');
                    if (!acc[path]) {
                        acc[path] = [];
                    }
                    acc[path].push(err.message);
                    return acc;
                }, {} as Record<string, string[]>);

                throw new ValidationError('Validation failed', formattedErrors);
            }
            next(error);
        }
    };
};

/**
 * Validates query parameters using a Zod schema
 * @param schema - Zod schema to validate against
 * @returns Middleware function that validates req.query
 * @throws ValidationError if validation fails
 * 
 * Example:
 *   router.get('/stories', validateQuery(storyQuerySchema), handler);
 */
export const validateQuery = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.query);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = error.errors.reduce((acc, err) => {
                    const path = err.path.join('.');
                    if (!acc[path]) {
                        acc[path] = [];
                    }
                    acc[path].push(err.message);
                    return acc;
                }, {} as Record<string, string[]>);

                throw new ValidationError('Query validation failed', formattedErrors);
            }
            next(error);
        }
    };
};

/**
 * Validates route parameters using a Zod schema
 * @param schema - Zod schema to validate against
 * @returns Middleware function that validates req.params
 * @throws ValidationError if validation fails
 * 
 * Example:
 *   router.get('/stories/:id', validateParams(z.object({ id: z.string().uuid() })), handler);
 */
export const validateParams = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.params);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = error.errors.reduce((acc, err) => {
                    const path = err.path.join('.');
                    if (!acc[path]) {
                        acc[path] = [];
                    }
                    acc[path].push(err.message);
                    return acc;
                }, {} as Record<string, string[]>);

                throw new ValidationError('Parameter validation failed', formattedErrors);
            }
            next(error);
        }
    };
};
