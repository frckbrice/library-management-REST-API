/**
 * Unit Tests for Media Controller
 */

import { Request, Response } from 'express';
import { MediaController } from '../../../src/controllers/media.controller';
import { mediaService } from '../../../src/services/media.service';
import { AuthorizationError } from '../../../src/utils/errors';
import { createMockRequest, createMockResponse, createMockSession } from '../../helpers/mocks';

jest.mock('../../../src/services/media.service');

const mockedMediaService = mediaService as jest.Mocked<typeof mediaService>;

describe('MediaController', () => {
    let mediaController: MediaController;
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
        mediaController = new MediaController();
        mockRequest = createMockRequest();
        mockResponse = createMockResponse();
        mockRequest.session = createMockSession(sessionUser) as any;
        jest.clearAllMocks();
    });

    describe('getMediaItems', () => {
        it('should return media with query filters', async () => {
            mockRequest.query = { libraryId: 'lib-1', approved: 'true', limit: '10' };
            const media = [{ id: 'm1', libraryId: 'lib-1' }] as any[];
            mockedMediaService.getMediaItems.mockResolvedValue(media);

            await mediaController.getMediaItems(mockRequest as Request, mockResponse as Response);

            expect(mockedMediaService.getMediaItems).toHaveBeenCalledWith(
                expect.objectContaining({
                    libraryId: 'lib-1',
                    approved: true,
                    limit: 10,
                })
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(media);
        });

        it('should handle tag as array', async () => {
            mockRequest.query = { tag: ['art', 'photo'] };
            mockedMediaService.getMediaItems.mockResolvedValue([]);

            await mediaController.getMediaItems(mockRequest as Request, mockResponse as Response);

            expect(mockedMediaService.getMediaItems).toHaveBeenCalledWith(
                expect.objectContaining({ tags: ['art', 'photo'] })
            );
        });
    });

    describe('getMediaItem', () => {
        it('should return single media item', async () => {
            mockRequest.params = { id: 'm1' };
            const item = { id: 'm1', url: 'https://example.com/img.jpg' } as any;
            mockedMediaService.getMediaItem.mockResolvedValue(item);

            await mediaController.getMediaItem(mockRequest as Request, mockResponse as Response);

            expect(mockedMediaService.getMediaItem).toHaveBeenCalledWith('m1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(item);
        });
    });

    describe('createMediaItem', () => {
        it('should create media when authenticated', async () => {
            mockRequest.body = { title: 'Photo' };
            const created = { id: 'm1', title: 'Photo', libraryId: 'lib-1' } as any;
            mockedMediaService.createMediaItem.mockResolvedValue(created);

            await mediaController.createMediaItem(mockRequest as Request, mockResponse as Response);

            expect(mockedMediaService.createMediaItem).toHaveBeenCalledWith(
                mockRequest.body,
                'lib-1',
                mockRequest.file
            );
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(created);
        });

        it('should throw when not logged in', async () => {
            mockRequest.session = {} as any;

            await expect(
                mediaController.createMediaItem(mockRequest as Request, mockResponse as Response)
            ).rejects.toMatchObject({ statusCode: 403, name: 'AuthorizationError' });
        });

        it('should throw when libraryId missing', async () => {
            (mockRequest.session as any).user = { ...sessionUser, libraryId: undefined };

            await expect(
                mediaController.createMediaItem(mockRequest as Request, mockResponse as Response)
            ).rejects.toMatchObject({ statusCode: 403, name: 'AuthorizationError' });
        });
    });

    describe('updateMediaItem', () => {
        it('should update media item', async () => {
            mockRequest.params = { id: 'm1' };
            mockRequest.body = { title: 'Updated' };
            const updated = { id: 'm1', title: 'Updated' } as any;
            mockedMediaService.updateMediaItem.mockResolvedValue(updated);

            await mediaController.updateMediaItem(mockRequest as Request, mockResponse as Response);

            expect(mockedMediaService.updateMediaItem).toHaveBeenCalledWith(
                'm1',
                mockRequest.body,
                'lib-1',
                'library_admin',
                mockRequest.file
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(updated);
        });
    });

    describe('getMediaTags', () => {
        it('should return tags when authenticated', async () => {
            const tags = ['art', 'photo'];
            mockedMediaService.getMediaTags.mockResolvedValue(tags);

            await mediaController.getMediaTags(mockRequest as Request, mockResponse as Response);

            expect(mockedMediaService.getMediaTags).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(tags);
        });

        it('should throw when not logged in', async () => {
            mockRequest.session = {} as any;

            await expect(
                mediaController.getMediaTags(mockRequest as Request, mockResponse as Response)
            ).rejects.toMatchObject({ statusCode: 403, name: 'AuthorizationError' });
        });
    });
});
