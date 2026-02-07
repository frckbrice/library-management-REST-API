/**
 * Global Error Handler Middleware
 *
 * Must be registered after all routes. Handles ZodErrors (400 + field errors),
 * AppError subclasses (status + optional details), and unknown errors (500).
 * Uses centralized api-response formatting; never leaks stack traces, internal
 * systems, or IPs to the client in production.
 *
 * @module src/middlewares/error-handler
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../utils/errors';
import { env } from '../config/env';
import { logger } from './logger';
import {
  formatErrorResponse,
  ErrorCode,
  type ApiErrorResponse,
} from '../utils/api-response';

const isProduction = env.NODE_ENV === 'production';

/**
 * Sends a standardized error response. In production, never attaches stack or raw internal messages.
 */
function sendError(
  res: Response,
  statusCode: number,
  body: ApiErrorResponse,
  devExtra?: Record<string, unknown>
): void {
  const payload = isProduction ? body : { ...body, ...devExtra };
  res.status(statusCode).json(payload);
}

/**
 * Central error handler. Logs the error, then sends a JSON response with
 * success: false, error (sanitized), optional code/errors, and timestamp.
 */
export const errorHandler = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.reduce((acc, error) => {
      const path = error.path.join('.');
      if (!acc[path]) {
        acc[path] = [];
      }
      acc[path].push(error.message);
      return acc;
    }, {} as Record<string, string[]>);

    const { body } = formatErrorResponse({
      statusCode: 400,
      error: 'Validation failed',
      code: ErrorCode.VALIDATION_ERROR,
      errors: formattedErrors,
      isProduction,
    });
    sendError(res, 400, body);
    return;
  }

  // Custom AppError
  if (err instanceof AppError) {
    const { statusCode, body } = formatErrorResponse({
      statusCode: err.statusCode,
      error: err.message,
      code: err.code as import('../utils/api-response').ErrorCodeType | undefined,
      errors: err instanceof ValidationError ? err.errors : undefined,
      isProduction,
      rawMessage: err.message,
    });
    sendError(res, statusCode, body, isProduction ? undefined : { stack: err.stack });
    return;
  }

  // Unexpected errors: generic message in production, no stack or raw message leak
  const { body } = formatErrorResponse({
    statusCode: 500,
    error: 'An unexpected error occurred. Please try again or contact support.',
    code: ErrorCode.INTERNAL_ERROR,
    isProduction,
    rawMessage: err.message,
  });
  sendError(res, 500, body, isProduction ? undefined : { stack: err.stack });
};

export default errorHandler;
