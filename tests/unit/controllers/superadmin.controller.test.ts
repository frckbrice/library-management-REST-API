/**
 * Unit Tests for SuperAdmin Controller
 */

import { Request, Response } from 'express';
import { SuperAdminController } from '../../../src/controllers/superadmin.controller';
import { superAdminService } from '../../../src/services/superadmin.service';
import { createMockRequest, createMockResponse } from '../../helpers/mocks';

jest.mock('../../../src/services/superadmin.service');

const mockedSuperAdminService = superAdminService as jest.Mocked<typeof superAdminService>;

describe('SuperAdminController', () => {
    let superAdminController: SuperAdminController;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        superAdminController = new SuperAdminController();
        mockRequest = createMockRequest();
        mockResponse = createMockResponse();
        jest.clearAllMocks();
    });

    describe('getStats', () => {
        it('should return super admin stats', async () => {
            const stats = {
                totalLibraries: 5,
                pendingLibraries: 1,
                totalStories: 20,
                pendingStories: 3,
                totalMedia: 50,
                uniqueGalleries: 10,
                totalUsers: 15,
                activeUsers: 12,
                recentActivity: [],
            };
            mockedSuperAdminService.getStats.mockResolvedValue(stats);

            await superAdminController.getStats(mockRequest as Request, mockResponse as Response);

            expect(mockedSuperAdminService.getStats).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(stats);
        });
    });

    describe('getPendingStories', () => {
        it('should return pending stories', async () => {
            const stories = [{ id: 's1', isApproved: false }] as any[];
            mockedSuperAdminService.getPendingStories.mockResolvedValue(stories);

            await superAdminController.getPendingStories(mockRequest as Request, mockResponse as Response);

            expect(mockedSuperAdminService.getPendingStories).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(stories);
        });
    });

    describe('getPendingMedia', () => {
        it('should return pending media', async () => {
            const media = [{ id: 'm1', isApproved: false }] as any[];
            mockedSuperAdminService.getPendingMedia.mockResolvedValue(media);

            await superAdminController.getPendingMedia(mockRequest as Request, mockResponse as Response);

            expect(mockedSuperAdminService.getPendingMedia).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(media);
        });
    });

    describe('approveStory', () => {
        it('should approve story', async () => {
            mockRequest.params = { id: 's1' };
            const story = { id: 's1', isApproved: true } as any;
            mockedSuperAdminService.approveStory.mockResolvedValue(story);

            await superAdminController.approveStory(mockRequest as Request, mockResponse as Response);

            expect(mockedSuperAdminService.approveStory).toHaveBeenCalledWith('s1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(story);
        });
    });

    describe('rejectStory', () => {
        it('should reject story', async () => {
            mockRequest.params = { id: 's1' };
            const story = { id: 's1', isApproved: false } as any;
            mockedSuperAdminService.rejectStory.mockResolvedValue(story);

            await superAdminController.rejectStory(mockRequest as Request, mockResponse as Response);

            expect(mockedSuperAdminService.rejectStory).toHaveBeenCalledWith('s1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(story);
        });
    });

    describe('approveMedia', () => {
        it('should approve media', async () => {
            mockRequest.params = { id: 'm1' };
            const media = { id: 'm1', isApproved: true } as any;
            mockedSuperAdminService.approveMedia.mockResolvedValue(media);

            await superAdminController.approveMedia(mockRequest as Request, mockResponse as Response);

            expect(mockedSuperAdminService.approveMedia).toHaveBeenCalledWith('m1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(media);
        });
    });

    describe('rejectMedia', () => {
        it('should reject media', async () => {
            mockRequest.params = { id: 'm1' };
            const media = { id: 'm1', isApproved: false } as any;
            mockedSuperAdminService.rejectMedia.mockResolvedValue(media);

            await superAdminController.rejectMedia(mockRequest as Request, mockResponse as Response);

            expect(mockedSuperAdminService.rejectMedia).toHaveBeenCalledWith('m1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(media);
        });
    });

    describe('getLibraries', () => {
        it('should return all libraries', async () => {
            const libraries = [{ id: 'lib-1', name: 'Lib 1' }] as any[];
            mockedSuperAdminService.getLibraries.mockResolvedValue(libraries);

            await superAdminController.getLibraries(mockRequest as Request, mockResponse as Response);

            expect(mockedSuperAdminService.getLibraries).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(libraries);
        });
    });

    describe('getUsers', () => {
        it('should return all users', async () => {
            const users = [{ id: 'u1', username: 'admin' }] as any[];
            mockedSuperAdminService.getUsers.mockResolvedValue(users);

            await superAdminController.getUsers(mockRequest as Request, mockResponse as Response);

            expect(mockedSuperAdminService.getUsers).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(users);
        });
    });

    describe('createUser', () => {
        it('should create user', async () => {
            mockRequest.body = {
                username: 'newuser',
                password: 'secret',
                email: 'u@test.com',
                fullName: 'New User',
                role: 'library_admin',
            };
            const user = { id: 'u1', username: 'newuser' } as any;
            mockedSuperAdminService.createUser.mockResolvedValue(user);

            await superAdminController.createUser(mockRequest as Request, mockResponse as Response);

            expect(mockedSuperAdminService.createUser).toHaveBeenCalledWith(mockRequest.body);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(user);
        });
    });

    describe('updateUser', () => {
        it('should update user', async () => {
            mockRequest.params = { id: 'u1' };
            mockRequest.body = { fullName: 'Updated Name' };
            const user = { id: 'u1', fullName: 'Updated Name' } as any;
            mockedSuperAdminService.updateUser.mockResolvedValue(user);

            await superAdminController.updateUser(mockRequest as Request, mockResponse as Response);

            expect(mockedSuperAdminService.updateUser).toHaveBeenCalledWith('u1', mockRequest.body);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(user);
        });
    });

    describe('resetUserPassword', () => {
        it('should reset user password', async () => {
            mockRequest.params = { id: 'u1' };
            mockRequest.body = { password: 'newpassword' };
            mockedSuperAdminService.resetUserPassword.mockResolvedValue(undefined as any);

            await superAdminController.resetUserPassword(mockRequest as Request, mockResponse as Response);

            expect(mockedSuperAdminService.resetUserPassword).toHaveBeenCalledWith('u1', 'newpassword');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Password reset successfully' });
        });
    });
});
