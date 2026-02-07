/**
 * Request Validation Middlewares
 *
 * Uses Zod schemas to validate req.body, req.query, or req.params. On failure,
 * passes a ValidationError to next() with field-level error details for
 * consistent API error responses.
 *
 * @module src/middlewares/validation
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

/**
 * Returns a middleware that validates req.body against the given Zod schema.
 * Parsed body is not mutated; use schema.parse() in the route if you need the coerced value.
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

        return next(new ValidationError('Validation failed', formattedErrors));
      }
      return next(error);
    }
  };
};

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

        return next(new ValidationError('Query validation failed', formattedErrors));
      }
      return next(error);
    }
  };
};

/**
 * Returns a middleware that validates req.params against the given Zod schema.
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

        return next(new ValidationError('Parameter validation failed', formattedErrors));
      }
      return next(error);
    }
  };
};
