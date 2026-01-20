/**
 * Unit Tests for Validation Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate, validateQuery, validateParams } from '../../../src/middlewares/validation';
import { ValidationError } from '../../../src/utils/errors';
import { createMockRequest, createMockResponse, createMockNext } from '../../utils/mocks';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
    mockNext = createMockNext();
  });

  describe('validate', () => {
    const loginSchema = z.object({
      username: z.string().min(1, 'Username is required'),
      password: z.string().min(6, 'Password must be at least 6 characters'),
    });

    it('should call next() when validation passes', () => {
      mockRequest.body = {
        username: 'testuser',
        password: 'password123',
      };

      const middleware = validate(loginSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should throw ValidationError when validation fails', () => {
      mockRequest.body = {
        username: '',
        password: '123',
      };

      const middleware = validate(loginSchema);

      expect(() => {
        middleware(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(ValidationError);
    });

    it('should format validation errors correctly', () => {
      mockRequest.body = {
        username: '',
        password: '123',
      };

      const middleware = validate(loginSchema);

      try {
        middleware(mockRequest as Request, mockResponse as Response, mockNext);
        fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.errors).toBeDefined();
        expect(validationError.errors).toHaveProperty('username');
        expect(validationError.errors).toHaveProperty('password');
      }
    });

    it('should handle nested validation errors', () => {
      const nestedSchema = z.object({
        user: z.object({
          name: z.string().min(1, 'Name is required'),
          email: z.string().email('Invalid email'),
        }),
      });

      mockRequest.body = {
        user: {
          name: '',
          email: 'invalid-email',
        },
      };

      const middleware = validate(nestedSchema);

      try {
        middleware(mockRequest as Request, mockResponse as Response, mockNext);
        fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.errors).toBeDefined();
        expect(validationError.errors).toHaveProperty('user.name');
        expect(validationError.errors).toHaveProperty('user.email');
      }
    });

    it('should pass non-ZodError to next', () => {
      const invalidSchema = {} as z.ZodSchema;
      mockRequest.body = {};

      const middleware = validate(invalidSchema);
      
      // This should not throw but pass error to next
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // The error handling depends on implementation, but next should be called
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validateQuery', () => {
    const querySchema = z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      search: z.string().optional(),
    });

    it('should call next() when query validation passes', () => {
      mockRequest.query = {
        page: '1',
        limit: '10',
        search: 'test',
      };

      const middleware = validateQuery(querySchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should throw ValidationError when query validation fails', () => {
      const strictQuerySchema = z.object({
        page: z.string().min(1, 'Page is required'),
      });

      mockRequest.query = {
        page: '',
      };

      const middleware = validateQuery(strictQuerySchema);

      expect(() => {
        middleware(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(ValidationError);
    });

    it('should format query validation errors correctly', () => {
      const strictQuerySchema = z.object({
        page: z.string().min(1, 'Page is required'),
      });

      mockRequest.query = {
        page: '',
      };

      const middleware = validateQuery(strictQuerySchema);

      try {
        middleware(mockRequest as Request, mockResponse as Response, mockNext);
        fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.message).toBe('Query validation failed');
        expect(validationError.errors).toBeDefined();
      }
    });
  });

  describe('validateParams', () => {
    const paramsSchema = z.object({
      id: z.string().uuid('Invalid ID format'),
    });

    it('should call next() when params validation passes', () => {
      mockRequest.params = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const middleware = validateParams(paramsSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should throw ValidationError when params validation fails', () => {
      mockRequest.params = {
        id: 'invalid-id',
      };

      const middleware = validateParams(paramsSchema);

      expect(() => {
        middleware(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(ValidationError);
    });

    it('should format params validation errors correctly', () => {
      mockRequest.params = {
        id: 'invalid-id',
      };

      const middleware = validateParams(paramsSchema);

      try {
        middleware(mockRequest as Request, mockResponse as Response, mockNext);
        fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.message).toBe('Parameter validation failed');
        expect(validationError.errors).toBeDefined();
        expect(validationError.errors).toHaveProperty('id');
      }
    });
  });
});
