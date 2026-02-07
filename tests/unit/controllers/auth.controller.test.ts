/**
 * Unit Tests for Auth Controller
 */

import { Request, Response } from 'express';
import { AuthController } from '../../../src/controllers/auth.controller';
import { AuthenticationError } from '../../../src/utils/errors';
import { authService } from '../../../src/services/auth.service';
import { logger } from '../../../src/middlewares/logger';
import { createMockRequest, createMockResponse, createMockSession } from '../../helpers/mocks';

// Mock dependencies
jest.mock('../../../src/services/auth.service');
jest.mock('../../../src/middlewares/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

const mockedAuthService = authService as jest.Mocked<typeof authService>;

describe('AuthController', () => {
    let authController: AuthController;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        authController = new AuthController();
        mockRequest = createMockRequest();
        mockResponse = createMockResponse();
        jest.clearAllMocks();
    });

    describe('login', () => {
        const mockSessionUser = {
            id: 'user-123',
            username: 'testuser',
            fullName: 'Test User',
            email: 'test@example.com',
            role: 'library_admin',
            libraryId: 'library-123',
        };

        it('should successfully login with valid credentials', async () => {
            mockRequest.body = {
                username: 'testuser',
                password: 'password123',
            };
            mockRequest.session = createMockSession() as any;

            mockedAuthService.authenticateUser.mockResolvedValue(mockSessionUser);

            await authController.login(mockRequest as Request, mockResponse as Response);

            expect(mockedAuthService.authenticateUser).toHaveBeenCalledWith({
                username: 'testuser',
                password: 'password123',
            });
            expect((mockRequest.session as any)!.user).toEqual(mockSessionUser);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockSessionUser,
            });
            expect(logger.info).toHaveBeenCalledWith('User logged in', {
                userId: 'user-123',
                username: 'testuser',
            });
        });

        it('should throw AuthenticationError when user does not exist', async () => {
            mockRequest.body = {
                username: 'nonexistent',
                password: 'password123',
            };

            mockedAuthService.authenticateUser.mockRejectedValue(
                new AuthenticationError('Invalid username or password')
            );

            await expect(
                authController.login(mockRequest as Request, mockResponse as Response)
            ).rejects.toMatchObject({ message: 'Invalid username or password', statusCode: 401 });

            expect(mockedAuthService.authenticateUser).toHaveBeenCalledWith({
                username: 'nonexistent',
                password: 'password123',
            });
            expect(mockResponse.json).not.toHaveBeenCalled();
        });

        it('should throw AuthenticationError when password does not match', async () => {
            mockRequest.body = {
                username: 'testuser',
                password: 'wrongpassword',
            };

            mockedAuthService.authenticateUser.mockRejectedValue(
                new AuthenticationError('Invalid username or password')
            );

            await expect(
                authController.login(mockRequest as Request, mockResponse as Response)
            ).rejects.toMatchObject({ message: 'Invalid username or password', statusCode: 401 });

            expect(mockedAuthService.authenticateUser).toHaveBeenCalledWith({
                username: 'testuser',
                password: 'wrongpassword',
            });
            expect((mockRequest.session as { user?: unknown })?.user).toBeUndefined();
        });

        it('should handle errors from authenticateUser', async () => {
            mockRequest.body = {
                username: 'testuser',
                password: 'password123',
            };

            mockedAuthService.authenticateUser.mockRejectedValue(new Error('Database error'));

            await expect(
                authController.login(mockRequest as Request, mockResponse as Response)
            ).rejects.toThrow('Database error');
        });
    });

    describe('getSession', () => {
        it('should return user session when user is logged in', async () => {
            const mockSessionUser = {
                id: 'user-123',
                username: 'testuser',
                fullName: 'Test User',
                email: 'test@example.com',
                role: 'library_admin',
                libraryId: 'library-123',
            };

            mockRequest.session = createMockSession(mockSessionUser) as any;

            await authController.getSession(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockSessionUser,
            });
        });

        it('should return null when user is not logged in', async () => {
            mockRequest.session = {} as any;

            await authController.getSession(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: null,
            });
        });

        it('should return null when session is undefined', async () => {
            mockRequest.session = undefined;

            await authController.getSession(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: null,
            });
        });
    });

    describe('logout', () => {
        it('should successfully logout and destroy session', async () => {
            const destroyCallback = jest.fn((callback: (err?: Error) => void) => callback(undefined));
            mockRequest.session = {
                ...createMockSession(),
                destroy: destroyCallback,
            } as any;

            await authController.logout(mockRequest as Request, mockResponse as Response);

            expect(destroyCallback).toHaveBeenCalled();
            expect(mockResponse.clearCookie).toHaveBeenCalledWith('connect.sid');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Logged out successfully',
            });
        });

        it('should reject when session destroy fails', async () => {
            const destroyError = new Error('Destroy failed');
            const destroyCallback = jest.fn((callback: (err?: Error) => void) => callback(destroyError));
            mockRequest.session = {
                ...createMockSession(),
                destroy: destroyCallback,
            } as any;

            await expect(
                authController.logout(mockRequest as Request, mockResponse as Response)
            ).rejects.toThrow('Destroy failed');

            expect(destroyCallback).toHaveBeenCalled();
            expect(mockResponse.clearCookie).not.toHaveBeenCalled();
        });
    });
});
