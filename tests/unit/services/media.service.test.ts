/**
 * Unit Tests for Media Service
 */

import { MediaService } from '../../../src/services/media.service';
import drizzleService from '../../../src/services/drizzle-services';
import * as sharedRoutes from '../../../src/routes/shared';

jest.mock('../../../src/services/drizzle-services');
jest.mock('../../../src/routes/shared');
jest.mock('../../../src/middlewares/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const mockedDrizzle = drizzleService as jest.Mocked<typeof drizzleService>;

describe('MediaService', () => {
    let mediaService: MediaService;

    beforeEach(() => {
        mediaService = new MediaService();
        jest.clearAllMocks();
    });

    describe('getMediaItems', () => {
        it('should return media with filters', async () => {
            const items = [{ id: 'm1', libraryId: 'lib-1' }];
            mockedDrizzle.getMediaItems.mockResolvedValue(items as any);

            const result = await mediaService.getMediaItems({ libraryId: 'lib-1' });
            expect(mockedDrizzle.getMediaItems).toHaveBeenCalledWith({ libraryId: 'lib-1' });
            expect(result).toEqual(items);
        });
    });

    describe('getMediaItem', () => {
        it('should return media item by id', async () => {
            const item = { id: 'm1', url: 'https://example.com/img.jpg' };
            mockedDrizzle.getMediaItem.mockResolvedValue(item as any);

            const result = await mediaService.getMediaItem('m1');
            expect(mockedDrizzle.getMediaItem).toHaveBeenCalledWith('m1');
            expect(result).toEqual(item);
        });

        it('should throw NotFoundError when not found', async () => {
            mockedDrizzle.getMediaItem.mockResolvedValue(undefined as any);

            await expect(mediaService.getMediaItem('m1')).rejects.toMatchObject({
                message: 'Media item not found',
                statusCode: 404,
                name: 'NotFoundError',
            });
        });
    });

    describe('createMediaItem', () => {
        it('should throw when libraryId missing', async () => {
            await expect(
                mediaService.createMediaItem({ title: 'M' }, '' as any)
            ).rejects.toThrow('Library ID required');
        });

        it('should throw when url and file both missing', async () => {
            await expect(
                mediaService.createMediaItem({ title: 'M' }, 'lib-1')
            ).rejects.toThrow('Media URL or file is required');
        });

        it('should create with url', async () => {
            const data = { title: 'Photo', url: 'https://example.com/p.jpg' };
            const created = { id: 'm1', ...data, libraryId: 'lib-1' };
            mockedDrizzle.createMediaItem.mockResolvedValue(created as any);

            const result = await mediaService.createMediaItem(data, 'lib-1');
            expect(mockedDrizzle.createMediaItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    ...data,
                    libraryId: 'lib-1',
                    isApproved: false,
                })
            );
            expect(result).toEqual(created);
        });
    });

    describe('updateMediaItem', () => {
        it('should throw NotFoundError when media not found', async () => {
            mockedDrizzle.getMediaItem.mockResolvedValue(undefined as any);

            await expect(
                mediaService.updateMediaItem('m1', {}, 'lib-1', 'library_admin')
            ).rejects.toMatchObject({
                message: 'Media item not found',
                statusCode: 404,
            });
        });

        it('should throw AuthorizationError when library_admin edits other library media', async () => {
            mockedDrizzle.getMediaItem.mockResolvedValue({ id: 'm1', libraryId: 'other-lib' } as any);

            await expect(
                mediaService.updateMediaItem('m1', { title: 'X' }, 'lib-1', 'library_admin')
            ).rejects.toMatchObject({
                message: 'You can only edit media for your library',
                statusCode: 403,
            });
        });
    });

    describe('getMediaTags', () => {
        it('should return sorted unique tags from all media', async () => {
            const items = [
                { id: 'm1', tags: ['art', 'photo'] },
                { id: 'm2', tags: ['art', 'nature'] },
            ];
            mockedDrizzle.getMediaItems.mockResolvedValue(items as any);

            const result = await mediaService.getMediaTags();
            expect(result).toEqual(['art', 'nature', 'photo']);
        });
    });
});
