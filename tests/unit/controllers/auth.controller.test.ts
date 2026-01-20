/**
 * Unit Tests for Auth Controller
 */

import { Request, Response } from 'express';
import { compare } from 'bcrypt';
import { AuthController } from '../../../src/controllers/auth.controller';
import { AuthenticationError } from '../../../src/utils/errors';
import drizzleService from '../../../services/drizzle-services';
import { logger } from '../../../src/middlewares/logger';
import { createMockRequest, createMockResponse, createMockSession } from '../../utils/mocks';

// Mock dependencies
jest.mock('bcrypt');
jest.mock('../../../services/drizzle-services');
jest.mock('../../../src/middlewares/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

const mockedCompare = compare as jest.MockedFunction<typeof compare>;
const mockedDrizzleService = drizzleService as jest.Mocked<typeof drizzleService>;

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
        const mockUser = {
            id: 'user-123',
            username: 'testuser',
            password: 'hashedPassword',
            fullName: 'Test User',
            email: 'test@example.com',
            role: 'library_admin',
            libraryId: 'library-123',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        it('should successfully login with valid credentials', async () => {
            mockRequest.body = {
                username: 'testuser',
                password: 'password123',
            };
            mockRequest.session = createMockSession() as any;

            mockedDrizzleService.getUserByUsername.mockResolvedValue(mockUser as any);
            (mockedCompare as jest.Mock).mockResolvedValue(true);

            await authController.login(mockRequest as Request, mockResponse as Response);

            expect(mockedDrizzleService.getUserByUsername).toHaveBeenCalledWith('testuser');
            expect(mockedCompare).toHaveBeenCalledWith('password123', 'hashedPassword');
            expect((mockRequest.session as any)!.user).toEqual({
                id: 'user-123',
                username: 'testuser',
                fullName: 'Test User',
                email: 'test@example.com',
                role: 'library_admin',
                libraryId: 'library-123',
            });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    id: 'user-123',
                    username: 'testuser',
                    fullName: 'Test User',
                    email: 'test@example.com',
                    role: 'library_admin',
                    libraryId: 'library-123',
                },
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

            mockedDrizzleService.getUserByUsername.mockResolvedValue(undefined);

            await expect(
                authController.login(mockRequest as Request, mockResponse as Response)
            ).rejects.toThrow(AuthenticationError);

            expect(mockedDrizzleService.getUserByUsername).toHaveBeenCalledWith('nonexistent');
            expect(mockedCompare).not.toHaveBeenCalled();
            expect(mockResponse.json).not.toHaveBeenCalled();
        });

        it('should throw AuthenticationError when password does not match', async () => {
            mockRequest.body = {
                username: 'testuser',
                password: 'wrongpassword',
            };

            mockedDrizzleService.getUserByUsername.mockResolvedValue(mockUser as any);
            (mockedCompare as jest.Mock).mockResolvedValue(false);

            await expect(
                authController.login(mockRequest as Request, mockResponse as Response)
            ).rejects.toThrow(AuthenticationError);

            expect(mockedDrizzleService.getUserByUsername).toHaveBeenCalledWith('testuser');
            expect(mockedCompare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword');
            expect((mockRequest.session as any)!.user).toBeUndefined();
        });

        it('should handle errors from getUserByUsername', async () => {
            mockRequest.body = {
                username: 'testuser',
                password: 'password123',
            };

            mockedDrizzleService.getUserByUsername.mockRejectedValue(new Error('Database error'));

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
