/**
 * Unit Tests for Stories Service
 */

import { StoriesService } from '../../../src/services/stories.service';
import drizzleService from '../../../src/services/drizzle-services';

jest.mock('../../../src/services/drizzle-services');
jest.mock('../../../src/routes/shared');
jest.mock('../../../src/middlewares/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const mockedDrizzle = drizzleService as jest.Mocked<typeof drizzleService>;

describe('StoriesService', () => {
    let storiesService: StoriesService;

    beforeEach(() => {
        storiesService = new StoriesService();
        jest.clearAllMocks();
    });

    describe('createStory', () => {
        it('should create story with libraryId', async () => {
            const data = { title: 'Story 1', content: 'Content' };
            const created = { id: 's1', ...data, libraryId: 'lib-1' };
            mockedDrizzle.createStory.mockResolvedValue(created as any);

            const result = await storiesService.createStory(data, 'lib-1');
            expect(mockedDrizzle.createStory).toHaveBeenCalledWith(
                expect.objectContaining({
                    ...data,
                    libraryId: 'lib-1',
                    isApproved: false,
                })
            );
            expect(result).toEqual(created);
        });
    });

    describe('updateStory', () => {
        it('should throw NotFoundError when story not found', async () => {
            mockedDrizzle.getStory.mockResolvedValue(undefined as any);

            await expect(
                storiesService.updateStory('s1', { title: 'X' }, 'lib-1', 'library_admin')
            ).rejects.toMatchObject({ message: 'Story not found', statusCode: 404, name: 'NotFoundError' });
        });

        it('should throw AuthorizationError when library_admin edits other library story', async () => {
            mockedDrizzle.getStory.mockResolvedValue({ id: 's1', libraryId: 'other-lib' } as any);

            await expect(
                storiesService.updateStory('s1', { title: 'X' }, 'lib-1', 'library_admin')
            ).rejects.toMatchObject({ message: 'You can only edit stories for your library', statusCode: 403, name: 'AuthorizationError' });
        });

        it('should update story when allowed', async () => {
            const existing = { id: 's1', libraryId: 'lib-1', isApproved: true };
            const updated = { id: 's1', libraryId: 'lib-1', title: 'New' };
            mockedDrizzle.getStory.mockResolvedValue(existing as any);
            mockedDrizzle.updateStory.mockResolvedValue(updated as any);

            const result = await storiesService.updateStory(
                's1',
                { title: 'New' },
                'lib-1',
                'library_admin'
            );
            expect(mockedDrizzle.updateStory).toHaveBeenCalled();
            expect(result).toEqual(updated);
        });
    });

    describe('getStory', () => {
        it('should return story by id', async () => {
            const story = { id: 's1', title: 'Story 1' };
            mockedDrizzle.getStory.mockResolvedValue(story as any);

            const result = await storiesService.getStory('s1');
            expect(mockedDrizzle.getStory).toHaveBeenCalledWith('s1');
            expect(result).toEqual(story);
        });

        it('should throw NotFoundError when not found', async () => {
            mockedDrizzle.getStory.mockResolvedValue(undefined as any);

            await expect(storiesService.getStory('s1')).rejects.toMatchObject({
                message: 'Story not found',
                statusCode: 404,
            });
        });
    });

    describe('getStories', () => {
        it('should return stories with filters', async () => {
            const stories = [{ id: 's1', libraryId: 'lib-1' }];
            mockedDrizzle.getStories.mockResolvedValue(stories as any);

            const result = await storiesService.getStories({ libraryId: 'lib-1' });
            expect(mockedDrizzle.getStories).toHaveBeenCalledWith({ libraryId: 'lib-1' });
            expect(result).toEqual(stories);
        });
    });

    describe('getStoryTags', () => {
        it('should return sorted unique tags from published approved stories', async () => {
            const stories = [
                { id: 's1', tags: ['history', 'art'] },
                { id: 's2', tags: ['art', 'culture'] },
            ];
            mockedDrizzle.getStories.mockResolvedValue(stories as any);

            const result = await storiesService.getStoryTags();
            expect(mockedDrizzle.getStories).toHaveBeenCalledWith({
                published: true,
                approved: true,
            });
            expect(result).toEqual(['art', 'culture', 'history']);
        });
    });

    describe('getTimelinesByStoryId', () => {
        it('should throw NotFoundError when story not found', async () => {
            mockedDrizzle.getStory.mockResolvedValue(undefined as any);

            await expect(storiesService.getTimelinesByStoryId('s1')).rejects.toMatchObject({
                message: 'Story not found',
                statusCode: 404,
                name: 'NotFoundError',
            });
        });

        it('should return timelines when story exists', async () => {
            mockedDrizzle.getStory.mockResolvedValue({ id: 's1' } as any);
            const timelines = [{ id: 't1', storyId: 's1' }];
            mockedDrizzle.getTimelinesByStoryId.mockResolvedValue(timelines as any);

            const result = await storiesService.getTimelinesByStoryId('s1');
            expect(mockedDrizzle.getTimelinesByStoryId).toHaveBeenCalledWith('s1');
            expect(result).toEqual(timelines);
        });
    });

    describe('createTimeline', () => {
        it('should throw NotFoundError when story not found', async () => {
            mockedDrizzle.getStory.mockResolvedValue(undefined as any);

            await expect(
                storiesService.createTimeline('s1', { title: 'T1' })
            ).rejects.toMatchObject({
                message: 'Story not found',
                statusCode: 404,
            });
        });

        it('should create timeline when story exists', async () => {
            mockedDrizzle.getStory.mockResolvedValue({ id: 's1' } as any);
            const timeline = { id: 't1', storyId: 's1', title: 'T1' };
            mockedDrizzle.createTimeline.mockResolvedValue(timeline as any);

            const result = await storiesService.createTimeline('s1', { title: 'T1' });
            expect(mockedDrizzle.createTimeline).toHaveBeenCalledWith(
                expect.objectContaining({
                    storyId: 's1',
                    title: 'T1',
                })
            );
            expect(result).toEqual(timeline);
        });
    });
});
