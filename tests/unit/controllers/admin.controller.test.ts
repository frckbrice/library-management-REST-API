/**
 * Unit Tests for Admin Controller
 */

import { Request, Response } from 'express';
import { AdminController } from '../../../src/controllers/admin.controller';
import { adminService } from '../../../src/services/admin.service';
import { createMockRequest, createMockResponse, createMockSession } from '../../helpers/mocks';

jest.mock('../../../src/services/admin.service');

const mockedAdminService = adminService as jest.Mocked<typeof adminService>;

describe('AdminController', () => {
    let adminController: AdminController;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    const sessionUser = {
        id: 'user-1',
        username: 'admin',
        fullName: 'Admin User',
        email: 'admin@test.com',
        role: 'library_admin',
        libraryId: 'lib-1',
    };

    beforeEach(() => {
        adminController = new AdminController();
        mockRequest = createMockRequest();
        mockResponse = createMockResponse();
        mockRequest.session = createMockSession(sessionUser) as any;
        jest.clearAllMocks();
    });

    describe('getDashboardStats', () => {
        it('should return dashboard stats for library', async () => {
            const stats = {
                totalStories: 10,
                publishedStories: 5,
                totalMedia: 20,
                approvedMedia: 15,
                totalEvents: 3,
                upcomingEvents: 2,
                totalMessages: 7,
                unreadMessages: 2,
            };
            mockedAdminService.getDashboardStats.mockResolvedValue(stats);

            await adminController.getDashboardStats(mockRequest as Request, mockResponse as Response);

            expect(mockedAdminService.getDashboardStats).toHaveBeenCalledWith('lib-1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(stats);
        });

        it('should throw when libraryId is missing', async () => {
            (mockRequest.session as any).user = { ...sessionUser, libraryId: undefined };

            await expect(
                adminController.getDashboardStats(mockRequest as Request, mockResponse as Response)
            ).rejects.toThrow('Library ID required');
            expect(mockedAdminService.getDashboardStats).not.toHaveBeenCalled();
        });
    });

    describe('getDashboardAnalytics', () => {
        it('should return analytics for library', async () => {
            const analytics = {
                visitorData: [],
                contentData: [],
                engagementData: [],
                topPerformers: {} as any,
            };
            mockedAdminService.getDashboardAnalytics.mockResolvedValue(analytics);

            await adminController.getDashboardAnalytics(mockRequest as Request, mockResponse as Response);

            expect(mockedAdminService.getDashboardAnalytics).toHaveBeenCalledWith('lib-1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(analytics);
        });

        it('should throw when libraryId is missing', async () => {
            (mockRequest.session as any).user = { ...sessionUser, libraryId: undefined };

            await expect(
                adminController.getDashboardAnalytics(mockRequest as Request, mockResponse as Response)
            ).rejects.toThrow('Library ID required');
        });
    });

    describe('getDashboardActivity', () => {
        it('should return activity for library', async () => {
            const activity = [{ type: 'story', title: 'Story updated', timestamp: new Date(), status: 'published' }];
            mockedAdminService.getDashboardActivity.mockResolvedValue(activity);

            await adminController.getDashboardActivity(mockRequest as Request, mockResponse as Response);

            expect(mockedAdminService.getDashboardActivity).toHaveBeenCalledWith('lib-1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(activity);
        });
    });

    describe('getGalleries', () => {
        it('should return galleries', async () => {
            const galleries = [{ id: 'g1', name: 'Gallery 1' }];
            mockedAdminService.getGalleries.mockResolvedValue(galleries as any);

            await adminController.getGalleries(mockRequest as Request, mockResponse as Response);

            expect(mockedAdminService.getGalleries).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(galleries);
        });
    });

    describe('deleteImage', () => {
        it('should delete image by publicId', async () => {
            mockRequest.params = { publicId: 'folder/image123' };
            mockedAdminService.deleteImage.mockResolvedValue(undefined as any);

            await adminController.deleteImage(mockRequest as Request, mockResponse as Response);

            expect(mockedAdminService.deleteImage).toHaveBeenCalledWith('folder/image123');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Image deleted successfully',
            });
        });
    });
});
