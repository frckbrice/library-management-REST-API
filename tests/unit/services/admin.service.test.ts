/**
 * Unit Tests for Admin Service
 */

import { AdminService } from '../../../src/services/admin.service';
import drizzleService from '../../../src/services/drizzle-services';

jest.mock('../../../src/services/drizzle-services');
jest.mock('../../../src/middlewares/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const mockedDrizzle = drizzleService as jest.Mocked<typeof drizzleService>;

describe('AdminService', () => {
    let adminService: AdminService;

    beforeEach(() => {
        adminService = new AdminService();
        jest.clearAllMocks();
    });

    describe('getDashboardStats', () => {
        it('should aggregate dashboard stats for library', async () => {
            const stories = [
                { id: 's1', isPublished: true, libraryId: 'lib-1' },
                { id: 's2', isPublished: false, libraryId: 'lib-1' },
            ];
            const mediaItems = [
                { id: 'm1', isApproved: true, libraryId: 'lib-1' },
                { id: 'm2', isApproved: false, libraryId: 'lib-1' },
            ];
            const events = [
                { id: 'e1', eventDate: new Date(Date.now() + 86400000), libraryId: 'lib-1' },
                { id: 'e2', eventDate: new Date(Date.now() - 86400000), libraryId: 'lib-1' },
            ];
            const messages = [
                { id: 'msg1', isRead: true, libraryId: 'lib-1' },
                { id: 'msg2', isRead: false, libraryId: 'lib-1' },
            ];
            mockedDrizzle.getStories.mockResolvedValue(stories as any);
            mockedDrizzle.getMediaItems.mockResolvedValue(mediaItems as any);
            mockedDrizzle.getEvents.mockResolvedValue(events as any);
            mockedDrizzle.getContactMessages.mockResolvedValue(messages as any);

            const result = await adminService.getDashboardStats('lib-1');

            expect(mockedDrizzle.getStories).toHaveBeenCalledWith({ libraryId: 'lib-1' });
            expect(result).toEqual({
                totalStories: 2,
                publishedStories: 1,
                totalMedia: 2,
                approvedMedia: 1,
                totalEvents: 2,
                upcomingEvents: 1,
                totalMessages: 2,
                unreadMessages: 1,
            });
        });
    });

    describe('getGalleries', () => {
        it('should return galleries from drizzle', async () => {
            const galleries = [{ id: 'g1', name: 'Gallery 1' }];
            mockedDrizzle.getGalleries.mockResolvedValue(galleries as any);

            const result = await adminService.getGalleries();
            expect(mockedDrizzle.getGalleries).toHaveBeenCalled();
            expect(result).toEqual(galleries);
        });
    });

    describe('deleteImage', () => {
        it('should throw when Cloudinary not configured', async () => {
            const cloudinaryMock = { isReady: jest.fn().mockReturnValue(false) };
            jest.doMock('../../../config/bucket-storage/cloudinary', () => ({
                cloudinaryService: cloudinaryMock,
            }));

            await expect(adminService.deleteImage('folder/img')).rejects.toThrow(
                'Cloudinary not configured'
            );
        });
    });
});
