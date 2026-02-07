/**
 * Unit Tests for Auth Service
 */

import { AuthService } from '../../../src/services/auth.service';
import { compare } from 'bcrypt';
import drizzleService from '../../../src/services/drizzle-services';

jest.mock('bcrypt');
jest.mock('../../../src/services/drizzle-services');
jest.mock('../../../src/middlewares/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const mockedCompare = compare as jest.MockedFunction<typeof compare>;
const mockedDrizzle = drizzleService as jest.Mocked<typeof drizzleService>;

describe('AuthService', () => {
    let authService: AuthService;

    beforeEach(() => {
        authService = new AuthService();
        jest.clearAllMocks();
    });

    describe('authenticateUser', () => {
        it('should return session user when credentials are valid', async () => {
            const user = {
                id: 'u1',
                username: 'testuser',
                password: 'hashed',
                fullName: 'Test User',
                email: 'test@test.com',
                role: 'library_admin',
                libraryId: 'lib-1',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastLoginAt: null,
            };
            mockedDrizzle.getUserByUsername.mockResolvedValue(user as any);
            mockedCompare.mockResolvedValue(true as never);

            const result = await authService.authenticateUser({
                username: 'testuser',
                password: 'password123',
            });

            expect(mockedDrizzle.getUserByUsername).toHaveBeenCalledWith('testuser');
            expect(mockedCompare).toHaveBeenCalledWith('password123', 'hashed');
            expect(result).toEqual({
                id: 'u1',
                username: 'testuser',
                fullName: 'Test User',
                email: 'test@test.com',
                role: 'library_admin',
                libraryId: 'lib-1',
            });
        });

        it('should throw AuthenticationError when user not found', async () => {
            mockedDrizzle.getUserByUsername.mockResolvedValue(undefined);

            await expect(
                authService.authenticateUser({ username: 'nobody', password: 'pass' })
            ).rejects.toMatchObject({
                message: 'Invalid username or password',
                statusCode: 401,
                name: 'AuthenticationError',
            });
            expect(mockedCompare).not.toHaveBeenCalled();
        });

        it('should throw AuthenticationError when password does not match', async () => {
            const user = {
                id: 'u1',
                username: 'testuser',
                password: 'hashed',
                fullName: 'Test',
                email: 't@t.com',
                role: 'admin',
                libraryId: 'lib-1',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastLoginAt: null,
            };
            mockedDrizzle.getUserByUsername.mockResolvedValue(user as any);
            mockedCompare.mockResolvedValue(false as never);

            await expect(
                authService.authenticateUser({ username: 'testuser', password: 'wrong' })
            ).rejects.toMatchObject({
                message: 'Invalid username or password',
                statusCode: 401,
                name: 'AuthenticationError',
            });
        });
    });

    describe('getUserById', () => {
        it('should return user from drizzle', async () => {
            const user = { id: 'u1', username: 'test' };
            mockedDrizzle.getUser.mockResolvedValue(user as any);

            const result = await authService.getUserById('u1');
            expect(mockedDrizzle.getUser).toHaveBeenCalledWith('u1');
            expect(result).toEqual(user);
        });
    });

    describe('getUserByUsername', () => {
        it('should return user from drizzle', async () => {
            const user = { id: 'u1', username: 'test' };
            mockedDrizzle.getUserByUsername.mockResolvedValue(user as any);

            const result = await authService.getUserByUsername('test');
            expect(mockedDrizzle.getUserByUsername).toHaveBeenCalledWith('test');
            expect(result).toEqual(user);
        });
    });
});
