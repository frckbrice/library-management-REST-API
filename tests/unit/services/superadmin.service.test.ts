/**
 * Unit Tests for SuperAdmin Service
 */

import { SuperAdminService } from '../../../src/services/superadmin.service';
import drizzleService from '../../../src/services/drizzle-services';
import bcrypt from 'bcrypt';

jest.mock('../../../src/services/drizzle-services');
jest.mock('bcrypt');
jest.mock('../../../src/middlewares/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const mockedDrizzle = drizzleService as jest.Mocked<typeof drizzleService>;
const mockedBcryptHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;

describe('SuperAdminService', () => {
    let superAdminService: SuperAdminService;

    beforeEach(() => {
        superAdminService = new SuperAdminService();
        jest.clearAllMocks();
        mockedBcryptHash.mockResolvedValue('hashed' as never);
    });

    describe('getStats', () => {
        it('should return aggregated stats', async () => {
            const libraries = [
                { id: 'lib-1', isApproved: true },
                { id: 'lib-2', isApproved: false },
            ];
            const stories = [
                { id: 's1', isApproved: true },
                { id: 's2', isApproved: false },
            ];
            const mediaItems = [{ id: 'm1', galleryId: 'g1' }, { id: 'm2', galleryId: 'g2' }];
            const users = [
                { id: 'u1', lastLoginAt: new Date() },
                { id: 'u2', lastLoginAt: null },
            ];
            mockedDrizzle.getLibraries.mockResolvedValue(libraries as any);
            mockedDrizzle.getStories.mockResolvedValue(stories as any);
            mockedDrizzle.getMediaItems.mockResolvedValue(mediaItems as any);
            mockedDrizzle.getUsersByLibraryId.mockResolvedValue(users as any);

            const result = await superAdminService.getStats();

            expect(result.totalLibraries).toBe(2);
            expect(result.pendingLibraries).toBe(1);
            expect(result.totalStories).toBe(2);
            expect(result.pendingStories).toBe(1);
            expect(result.totalMedia).toBe(2);
            expect(result.uniqueGalleries).toBe(2);
            expect(result.totalUsers).toBeGreaterThanOrEqual(0);
            expect(result.recentActivity).toBeDefined();
        });
    });

    describe('getPendingStories', () => {
        it('should return stories with approved false', async () => {
            const stories = [{ id: 's1', isApproved: false }];
            mockedDrizzle.getStories.mockResolvedValue(stories as any);

            const result = await superAdminService.getPendingStories();
            expect(mockedDrizzle.getStories).toHaveBeenCalledWith({ approved: false });
            expect(result).toEqual(stories);
        });
    });

    describe('getPendingMedia', () => {
        it('should return media with approved false', async () => {
            const media = [{ id: 'm1', isApproved: false }];
            mockedDrizzle.getMediaItems.mockResolvedValue(media as any);

            const result = await superAdminService.getPendingMedia();
            expect(mockedDrizzle.getMediaItems).toHaveBeenCalledWith({ approved: false });
            expect(result).toEqual(media);
        });
    });

    describe('approveStory', () => {
        it('should update story to approved', async () => {
            const updated = { id: 's1', isApproved: true };
            mockedDrizzle.updateStory.mockResolvedValue(updated as any);

            const result = await superAdminService.approveStory('s1');
            expect(mockedDrizzle.updateStory).toHaveBeenCalledWith('s1', { isApproved: true });
            expect(result).toEqual(updated);
        });

        it('should throw NotFoundError when story not found', async () => {
            mockedDrizzle.updateStory.mockResolvedValue(undefined as any);

            await expect(superAdminService.approveStory('s1')).rejects.toMatchObject({
                message: 'Story not found',
                statusCode: 404,
            });
        });
    });

    describe('rejectStory', () => {
        it('should update story to not approved', async () => {
            const updated = { id: 's1', isApproved: false };
            mockedDrizzle.updateStory.mockResolvedValue(updated as any);

            const result = await superAdminService.rejectStory('s1');
            expect(mockedDrizzle.updateStory).toHaveBeenCalledWith('s1', { isApproved: false });
            expect(result).toEqual(updated);
        });
    });

    describe('createUser', () => {
        it('should throw when required fields missing', async () => {
            await expect(
                superAdminService.createUser({
                    username: '',
                    password: 'p',
                    email: 'e@e.com',
                    fullName: 'F',
                    role: 'admin',
                } as any)
            ).rejects.toThrow('Missing required fields');
        });

        it('should hash password and create user', async () => {
            const userData = {
                username: 'newuser',
                password: 'plain',
                email: 'u@test.com',
                fullName: 'New User',
                role: 'library_admin',
            };
            const created = { id: 'u1', username: 'newuser' };
            mockedDrizzle.createUser.mockResolvedValue(created as any);

            const result = await superAdminService.createUser(userData as any);
            expect(mockedBcryptHash).toHaveBeenCalledWith('plain', 10);
            expect(mockedDrizzle.createUser).toHaveBeenCalledWith(
                expect.objectContaining({
                    username: 'newuser',
                    password: 'hashed',
                    email: 'u@test.com',
                    fullName: 'New User',
                    role: 'library_admin',
                })
            );
            expect(result).toEqual(created);
        });
    });

    describe('updateUser', () => {
        it('should throw NotFoundError when user not found', async () => {
            mockedDrizzle.updateUser.mockResolvedValue(undefined as any);

            await expect(
                superAdminService.updateUser('u1', { fullName: 'X' })
            ).rejects.toMatchObject({ message: 'User not found', statusCode: 404, name: 'NotFoundError' });
        });

        it('should update user', async () => {
            const updated = { id: 'u1', fullName: 'Updated' };
            mockedDrizzle.updateUser.mockResolvedValue(updated as any);

            const result = await superAdminService.updateUser('u1', { fullName: 'Updated' });
            expect(mockedDrizzle.updateUser).toHaveBeenCalledWith('u1', { fullName: 'Updated' });
            expect(result).toEqual(updated);
        });
    });

    describe('resetUserPassword', () => {
        it('should throw when password empty', async () => {
            await expect(
                superAdminService.resetUserPassword('u1', '')
            ).rejects.toThrow('Password is required');
        });

        it('should hash and update password', async () => {
            mockedDrizzle.updateUser.mockResolvedValue({ id: 'u1' } as any);

            await superAdminService.resetUserPassword('u1', 'newpass');
            expect(mockedBcryptHash).toHaveBeenCalledWith('newpass', 10);
            expect(mockedDrizzle.updateUser).toHaveBeenCalledWith('u1', {
                password: 'hashed',
            });
        });

        it('should throw NotFoundError when user not found', async () => {
            mockedDrizzle.updateUser.mockResolvedValue(undefined as any);

            await expect(
                superAdminService.resetUserPassword('u1', 'newpass')
            ).rejects.toMatchObject({
                message: 'User not found',
                statusCode: 404,
            });
        });
    });
});
