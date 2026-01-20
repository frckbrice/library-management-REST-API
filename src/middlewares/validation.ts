import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

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
