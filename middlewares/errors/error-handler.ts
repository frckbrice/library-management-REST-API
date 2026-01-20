/**
 * Centralized Error Handler Middleware
 * 
 * This middleware catches all errors and formats them into consistent
 * JSON responses. It handles:
 * - Zod validation errors (from request validation)
 * - Custom AppError instances (ValidationError, NotFoundError, etc.)
 * - Unexpected errors (programming errors, unhandled exceptions)
 * 
 * Usage:
 *   app.use(errorHandler); // Must be registered after all routes
 * 
 * Error Response Format:
 *   {
 *     success: false,
 *     error: "Error message",
 *     code: "ERROR_CODE",
 *     timestamp: "2024-01-01T00:00:00.000Z",
 *     errors?: { field: ["Error message"] }, // For validation errors
 *     stack?: "..." // Only in development
 *   }
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../../src/utils/errors';
import { env } from '../../src/config/env';
import { logger } from '../../src/middlewares/logger';

/**
 * Error handler middleware - must be registered last
 * Catches all errors and formats them into consistent JSON responses
 */
const errorHandler = (err: Error | AppError | ZodError, req: Request, res: Response, next: NextFunction): void => {
    // Log all errors for debugging and monitoring
    logger.error('Error occurred', {
        error: err.message,
        stack: err.stack,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });

    // Handle Zod validation errors (from validate middleware)
    if (err instanceof ZodError) {
        const formattedErrors = err.errors.reduce((acc, error) => {
            const path = error.path.join('.');
            if (!acc[path]) {
                acc[path] = [];
            }
            acc[path].push(error.message);
            return acc;
        }, {} as Record<string, string[]>);

        res.status(400).json({
            success: false,
            error: 'Validation failed',
            errors: formattedErrors,
            timestamp: new Date().toISOString(),
        });
        return;
    }

    // Handle custom AppError instances (ValidationError, NotFoundError, etc.)
    if (err instanceof AppError) {
        const response: any = {
            success: false,
            error: err.message,
            code: err.code,
            timestamp: new Date().toISOString(),
        };

        // Include field-specific errors for ValidationError
        if (err instanceof ValidationError && err.errors) {
            response.errors = err.errors;
        }

        // Include stack trace in development for debugging
        if (env.NODE_ENV === 'development') {
            response.stack = err.stack;
        }

        res.status(err.statusCode).json(response);
        return;
    }

    // Handle unexpected errors (programming errors, unhandled exceptions)
    // Don't expose internal error details in production
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

export default errorHandler;
