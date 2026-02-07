/**
 * Unit Tests for Events Service
 */

import { EventsService } from '../../../src/services/events.service';
import drizzleService from '../../../src/services/drizzle-services';
import * as sharedRoutes from '../../../src/routes/shared';

jest.mock('../../../src/services/drizzle-services');
jest.mock('../../../src/routes/shared');
jest.mock('../../../src/middlewares/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const mockedDrizzle = drizzleService as jest.Mocked<typeof drizzleService>;
const mockedUpload = sharedRoutes.uploadImageToCloudinary as jest.MockedFunction<
    typeof sharedRoutes.uploadImageToCloudinary
>;

describe('EventsService', () => {
    let eventsService: EventsService;

    beforeEach(() => {
        eventsService = new EventsService();
        jest.clearAllMocks();
    });

    describe('createEvent', () => {
        it('should create event with libraryId', async () => {
            const data = { title: 'Event 1', eventDate: new Date('2025-12-01') };
            const created = { id: 'e1', ...data, libraryId: 'lib-1' };
            mockedDrizzle.createEvent.mockResolvedValue(created as any);

            const result = await eventsService.createEvent(data, 'lib-1');
            expect(mockedDrizzle.createEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    ...data,
                    libraryId: 'lib-1',
                    isApproved: false,
                })
            );
            expect(result).toEqual(created);
        });

        it('should throw when libraryId missing', async () => {
            await expect(
                eventsService.createEvent({ title: 'E' }, '' as any)
            ).rejects.toThrow('Library ID required');
        });

        it('should upload file when provided', async () => {
            const file = { buffer: Buffer.from('x'), mimetype: 'image/jpeg' } as any;
            mockedUpload.mockResolvedValue('https://example.com/img.jpg');
            mockedDrizzle.createEvent.mockResolvedValue({ id: 'e1', imageUrl: 'https://example.com/img.jpg' } as any);

            await eventsService.createEvent({ title: 'E' }, 'lib-1', file);
            expect(mockedUpload).toHaveBeenCalledWith(file, 'events');
        });
    });

    describe('updateEvent', () => {
        it('should throw NotFoundError when event not found', async () => {
            mockedDrizzle.getEvent.mockResolvedValue(undefined as any);

            await expect(
                eventsService.updateEvent('e1', {}, 'lib-1', 'library_admin')
            ).rejects.toMatchObject({
                message: 'Event not found',
                statusCode: 404,
            });
        });

        it('should throw AuthorizationError when library_admin edits other library event', async () => {
            mockedDrizzle.getEvent.mockResolvedValue({ id: 'e1', libraryId: 'other-lib' } as any);

            await expect(
                eventsService.updateEvent('e1', { title: 'X' }, 'lib-1', 'library_admin')
            ).rejects.toMatchObject({
                message: 'You can only edit events for your library',
                statusCode: 403,
            });
        });

        it('should update event when ownership ok', async () => {
            const existing = { id: 'e1', libraryId: 'lib-1', title: 'Old' };
            const updated = { id: 'e1', libraryId: 'lib-1', title: 'New' };
            mockedDrizzle.getEvent.mockResolvedValue(existing as any);
            mockedDrizzle.updateEvent.mockResolvedValue(updated as any);

            const result = await eventsService.updateEvent('e1', { title: 'New' }, 'lib-1', 'library_admin');
            expect(mockedDrizzle.updateEvent).toHaveBeenCalledWith('e1', expect.objectContaining({ title: 'New' }));
            expect(result).toEqual(updated);
        });
    });

    describe('getEvents', () => {
        it('should return events with optional libraryId', async () => {
            const events = [{ id: 'e1', libraryId: 'lib-1' }];
            mockedDrizzle.getEvents.mockResolvedValue(events as any);

            const result = await eventsService.getEvents({ libraryId: 'lib-1' });
            expect(mockedDrizzle.getEvents).toHaveBeenCalledWith({ libraryId: 'lib-1' });
            expect(result).toEqual(events);
        });
    });

    describe('deleteEvent', () => {
        it('should throw NotFoundError when event not found', async () => {
            mockedDrizzle.deleteEvent.mockResolvedValue(false as any);

            await expect(eventsService.deleteEvent('e1')).rejects.toMatchObject({
                message: 'Event not found',
                statusCode: 404,
                name: 'NotFoundError',
            });
        });

        it('should return true when deleted', async () => {
            mockedDrizzle.deleteEvent.mockResolvedValue(true as any);

            const result = await eventsService.deleteEvent('e1');
            expect(mockedDrizzle.deleteEvent).toHaveBeenCalledWith('e1');
            expect(result).toBe(true);
        });
    });
});
