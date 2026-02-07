/**
 * Unit Tests for Stories Controller
 */

import { Request, Response } from 'express';
import { StoriesController } from '../../../src/controllers/stories.controller';
import { storiesService } from '../../../src/services/stories.service';
import { createMockRequest, createMockResponse, createMockSession } from '../../helpers/mocks';

jest.mock('../../../src/services/stories.service');

const mockedStoriesService = storiesService as jest.Mocked<typeof storiesService>;

describe('StoriesController', () => {
    let storiesController: StoriesController;
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
        storiesController = new StoriesController();
        mockRequest = createMockRequest();
        mockResponse = createMockResponse();
        mockRequest.session = createMockSession(sessionUser) as any;
        jest.clearAllMocks();
    });

    describe('createStory', () => {
        it('should create story with libraryId from session', async () => {
            mockRequest.body = { title: 'Story 1', content: 'Content' };
            const story = { id: 's1', title: 'Story 1', libraryId: 'lib-1' } as any;
            mockedStoriesService.createStory.mockResolvedValue(story);

            await storiesController.createStory(mockRequest as Request, mockResponse as Response);

            expect(mockedStoriesService.createStory).toHaveBeenCalledWith(
                mockRequest.body,
                'lib-1',
                mockRequest.file
            );
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: true, data: story });
        });
    });

    describe('updateStory', () => {
        it('should update story', async () => {
            mockRequest.params = { id: 's1' };
            mockRequest.body = { title: 'Updated' };
            const updated = { id: 's1', title: 'Updated', libraryId: 'lib-1' } as any;
            mockedStoriesService.updateStory.mockResolvedValue(updated);

            await storiesController.updateStory(mockRequest as Request, mockResponse as Response);

            expect(mockedStoriesService.updateStory).toHaveBeenCalledWith(
                's1',
                mockRequest.body,
                'lib-1',
                'library_admin',
                mockRequest.file
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: true, data: updated });
        });
    });

    describe('getStory', () => {
        it('should return story by id', async () => {
            mockRequest.params = { id: 's1' };
            const story = { id: 's1', title: 'Story 1' } as any;
            mockedStoriesService.getStory.mockResolvedValue(story);

            await storiesController.getStory(mockRequest as Request, mockResponse as Response);

            expect(mockedStoriesService.getStory).toHaveBeenCalledWith('s1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: true, data: story });
        });
    });

    describe('getStories', () => {
        it('should return stories with query filters', async () => {
            mockRequest.query = { libraryId: 'lib-1', published: 'true', limit: '5' };
            const stories = [{ id: 's1', title: 'Story 1' }] as any[];
            mockedStoriesService.getStories.mockResolvedValue(stories);

            await storiesController.getStories(mockRequest as Request, mockResponse as Response);

            expect(mockedStoriesService.getStories).toHaveBeenCalledWith(
                expect.objectContaining({
                    libraryId: 'lib-1',
                    published: true,
                    limit: 5,
                })
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(stories);
        });
    });

    describe('getStoryTags', () => {
        it('should return story tags', async () => {
            const tags = ['history', 'art'];
            mockedStoriesService.getStoryTags.mockResolvedValue(tags);

            await storiesController.getStoryTags(mockRequest as Request, mockResponse as Response);

            expect(mockedStoriesService.getStoryTags).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(tags);
        });
    });

    describe('getTimelines', () => {
        it('should return timelines for story', async () => {
            mockRequest.params = { id: 's1' };
            const timelines = [{ id: 't1', storyId: 's1', title: 'Timeline 1' }] as any[];
            mockedStoriesService.getTimelinesByStoryId.mockResolvedValue(timelines);

            await storiesController.getTimelines(mockRequest as Request, mockResponse as Response);

            expect(mockedStoriesService.getTimelinesByStoryId).toHaveBeenCalledWith('s1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(timelines);
        });
    });

    describe('createTimeline', () => {
        it('should create timeline for story', async () => {
            mockRequest.params = { id: 's1' };
            mockRequest.body = { title: 'New Timeline', year: 2020 };
            const timeline = { id: 't1', storyId: 's1', title: 'New Timeline' } as any;
            mockedStoriesService.createTimeline.mockResolvedValue(timeline);

            await storiesController.createTimeline(mockRequest as Request, mockResponse as Response);

            expect(mockedStoriesService.createTimeline).toHaveBeenCalledWith('s1', mockRequest.body);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(timeline);
        });
    });
});
