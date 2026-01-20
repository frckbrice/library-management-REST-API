import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../utils/errors';
import { env } from '../config/env';
import { logger } from './logger';

export const errorHandler = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Handle Zod validation errors
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

  // Handle custom AppError
  if (err instanceof AppError) {
    const response: any = {
      success: false,
      error: err.message,
      code: err.code,
      timestamp: new Date().toISOString(),
    };

    if (err instanceof ValidationError && err.errors) {
      response.errors = err.errors;
    }

    if (env.NODE_ENV === 'development') {
      response.stack = err.stack;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle unexpected errors
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
