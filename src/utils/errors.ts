/**
 * Custom Error Classes
 * 
 * These error classes provide a consistent way to handle errors throughout
 * the application. They extend the base AppError class and are automatically
 * handled by the error handler middleware.
 * 
 * Usage:
 *   throw new NotFoundError('Story');
 *   throw new ValidationError('Invalid input', { field: ['Error message'] });
 *   throw new AuthenticationError('Invalid credentials');
 * 
 * Error Handler:
 *   All errors are caught by the error handler middleware in
 *   src/middlewares/error-handler.ts which formats the response.
 */

/**
 * Base error class for all application errors
 * @param statusCode - HTTP status code
 * @param message - Error message
 * @param isOperational - Whether this is an operational error (vs programming error)
 * @param code - Error code for client-side handling
 */
export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public isOperational = true,
        public code?: string
    ) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Validation error (400) - Used when request validation fails
 * @param message - Error message
 * @param errors - Field-specific validation errors
 */
export class ValidationError extends AppError {
    constructor(message: string, public errors?: Record<string, string[]>) {
        super(400, message, true, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
    }
}

/**
 * Authentication error (401) - Used when user is not authenticated
 * @param message - Error message (default: 'Authentication required')
 */
export class AuthenticationError extends AppError {
    constructor(message: string = 'Authentication required') {
        super(401, message, true, 'AUTHENTICATION_ERROR');
        this.name = 'AuthenticationError';
    }
}

/**
 * Authorization error (403) - Used when user lacks required permissions
 * @param message - Error message (default: 'Insufficient permissions')
 */
export class AuthorizationError extends AppError {
    constructor(message: string = 'Insufficient permissions') {
        super(403, message, true, 'AUTHORIZATION_ERROR');
        this.name = 'AuthorizationError';
    }
}

/**
 * Not found error (404) - Used when a resource doesn't exist
 * @param resource - Resource name (e.g., 'Story', 'User')
 */
export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource') {
        super(404, `${resource} not found`, true, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}

/**
 * Conflict error (409) - Used when there's a resource conflict
 * @param message - Error message describing the conflict
 */
export class ConflictError extends AppError {
    constructor(message: string) {
        super(409, message, true, 'CONFLICT');
        this.name = 'ConflictError';
    }
}

/**
 * Internal server error (500) - Used for unexpected server errors
 * @param message - Error message (default: 'Internal server error')
 */
export class InternalServerError extends AppError {
    constructor(message: string = 'Internal server error') {
        super(500, message, false, 'INTERNAL_ERROR');
        this.name = 'InternalServerError';
    }
}
