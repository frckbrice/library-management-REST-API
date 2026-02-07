/**
 * Unit Tests for Validation Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate, validateQuery, validateParams } from '../../../src/middlewares/validation';
import { ValidationError } from '../../../src/utils/errors';
import { createMockRequest, createMockResponse, createMockNext } from '../../helpers/mocks';

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

    it('should call next with ValidationError when validation fails', () => {
      mockRequest.body = {
        username: '',
        password: '123',
      };

      const middleware = validate(loginSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const err = (mockNext as jest.Mock).mock.calls[0][0];
      expect(err.name).toBe('ValidationError');
      expect(err.statusCode).toBe(400);
    });

    it('should format validation errors correctly', () => {
      mockRequest.body = {
        username: '',
        password: '123',
      };

      const middleware = validate(loginSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const validationError = (mockNext as jest.Mock).mock.calls[0][0];
      expect(validationError.name).toBe('ValidationError');
      expect(validationError.errors).toBeDefined();
      expect(validationError.errors).toHaveProperty('username');
      expect(validationError.errors).toHaveProperty('password');
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
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const validationError = (mockNext as jest.Mock).mock.calls[0][0];
      expect(validationError.name).toBe('ValidationError');
      expect(validationError.errors).toBeDefined();
      expect(Object.keys(validationError.errors || {})).toContain('user.name');
      expect(Object.keys(validationError.errors || {})).toContain('user.email');
    });

    it('should pass non-ZodError to next', () => {
      const invalidSchema = {} as z.ZodSchema;
      mockRequest.body = {};

      const middleware = validate(invalidSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
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

    it('should call next with ValidationError when query validation fails', () => {
      const strictQuerySchema = z.object({
        page: z.string().min(1, 'Page is required'),
      });

      mockRequest.query = {
        page: '',
      };

      const middleware = validateQuery(strictQuerySchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const err = (mockNext as jest.Mock).mock.calls[0][0];
      expect(err.name).toBe('ValidationError');
      expect(err.message).toBe('Query validation failed');
    });

    it('should format query validation errors correctly', () => {
      const strictQuerySchema = z.object({
        page: z.string().min(1, 'Page is required'),
      });

      mockRequest.query = {
        page: '',
      };

      const middleware = validateQuery(strictQuerySchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const validationError = (mockNext as jest.Mock).mock.calls[0][0];
      expect(validationError.name).toBe('ValidationError');
      expect(validationError.message).toBe('Query validation failed');
      expect(validationError.errors).toBeDefined();
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

    it('should call next with ValidationError when params validation fails', () => {
      mockRequest.params = {
        id: 'invalid-id',
      };

      const middleware = validateParams(paramsSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const err = (mockNext as jest.Mock).mock.calls[0][0];
      expect(err.name).toBe('ValidationError');
      expect(err.message).toBe('Parameter validation failed');
    });

    it('should format params validation errors correctly', () => {
      mockRequest.params = {
        id: 'invalid-id',
      };

      const middleware = validateParams(paramsSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const validationError = (mockNext as jest.Mock).mock.calls[0][0];
      expect(validationError.name).toBe('ValidationError');
      expect(validationError.message).toBe('Parameter validation failed');
      expect(validationError.errors).toBeDefined();
      expect(validationError.errors).toHaveProperty('id');
    });
  });
});
