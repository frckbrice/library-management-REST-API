/**
 * Unit Tests for Auth Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole, requireSuperAdmin, requireLibraryAdmin } from '../../../src/middlewares/auth';
import { AuthenticationError, AuthorizationError } from '../../../src/utils/errors';
import { createMockRequest, createMockResponse, createMockNext, createMockSession } from '../../utils/mocks';

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
    mockNext = createMockNext();
  });

  describe('requireAuth', () => {
    it('should call next() when user is authenticated', () => {
      mockRequest.session = createMockSession();
      
      requireAuth(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should throw AuthenticationError when user is not authenticated', () => {
      mockRequest.session = {} as any;
      
      expect(() => {
        requireAuth(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(AuthenticationError);
      
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw AuthenticationError when session is undefined', () => {
      mockRequest.session = undefined;
      
      expect(() => {
        requireAuth(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(AuthenticationError);
    });
  });

  describe('requireRole', () => {
    it('should call next() when user has required role', () => {
      mockRequest.session = createMockSession({
        id: 'test-id',
        username: 'testuser',
        role: 'library_admin',
      });
      
      const middleware = requireRole('library_admin');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next() when user has one of multiple required roles', () => {
      mockRequest.session = createMockSession({
        id: 'test-id',
        username: 'testuser',
        role: 'super_admin',
      });
      
      const middleware = requireRole('library_admin', 'super_admin');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should throw AuthenticationError when user is not authenticated', () => {
      mockRequest.session = {} as any;
      
      const middleware = requireRole('library_admin');
      
      expect(() => {
        middleware(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(AuthenticationError);
    });

    it('should throw AuthorizationError when user does not have required role', () => {
      mockRequest.session = createMockSession({
        id: 'test-id',
        username: 'testuser',
        role: 'user',
      });
      
      const middleware = requireRole('library_admin', 'super_admin');
      
      expect(() => {
        middleware(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(AuthorizationError);
    });

    it('should include required roles in error message', () => {
      mockRequest.session = createMockSession({
        id: 'test-id',
        username: 'testuser',
        role: 'user',
      });
      
      const middleware = requireRole('library_admin', 'super_admin');
      
      try {
        middleware(mockRequest as Request, mockResponse as Response, mockNext);
        fail('Should have thrown AuthorizationError');
      } catch (error) {
        expect(error).toBeInstanceOf(AuthorizationError);
        expect((error as AuthorizationError).message).toContain('library_admin');
        expect((error as AuthorizationError).message).toContain('super_admin');
      }
    });
  });

  describe('requireSuperAdmin', () => {
    it('should call next() when user is super_admin', () => {
      mockRequest.session = createMockSession({
        id: 'test-id',
        username: 'testuser',
        role: 'super_admin',
      });
      
      requireSuperAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should throw AuthorizationError when user is not super_admin', () => {
      mockRequest.session = createMockSession({
        id: 'test-id',
        username: 'testuser',
        role: 'library_admin',
      });
      
      expect(() => {
        requireSuperAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(AuthorizationError);
    });
  });

  describe('requireLibraryAdmin', () => {
    it('should call next() when user is library_admin', () => {
      mockRequest.session = createMockSession({
        id: 'test-id',
        username: 'testuser',
        role: 'library_admin',
      });
      
      requireLibraryAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should call next() when user is super_admin', () => {
      mockRequest.session = createMockSession({
        id: 'test-id',
        username: 'testuser',
        role: 'super_admin',
      });
      
      requireLibraryAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should throw AuthorizationError when user is not library_admin or super_admin', () => {
      mockRequest.session = createMockSession({
        id: 'test-id',
        username: 'testuser',
        role: 'user',
      });
      
      expect(() => {
        requireLibraryAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(AuthorizationError);
    });
  });
});
