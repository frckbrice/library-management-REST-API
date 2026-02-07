/**
 * Unit Tests for Events Controller
 */

import { Request, Response } from 'express';
import { EventsController } from '../../../src/controllers/events.controller';
import { eventsService } from '../../../src/services/events.service';
import { AuthorizationError } from '../../../src/utils/errors';
import { createMockRequest, createMockResponse, createMockSession } from '../../helpers/mocks';

jest.mock('../../../src/services/events.service');

const mockedEventsService = eventsService as jest.Mocked<typeof eventsService>;

describe('EventsController', () => {
    let eventsController: EventsController;
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
        eventsController = new EventsController();
        mockRequest = createMockRequest();
        mockResponse = createMockResponse();
        mockRequest.session = createMockSession(sessionUser) as any;
        jest.clearAllMocks();
    });

    describe('createEvent', () => {
        it('should create event when authenticated with libraryId', async () => {
            mockRequest.body = { title: 'Event 1', eventDate: '2025-12-01' };
            const event = { id: 'e1', title: 'Event 1', libraryId: 'lib-1' } as any;
            mockedEventsService.createEvent.mockResolvedValue(event);

            await eventsController.createEvent(mockRequest as Request, mockResponse as Response);

            expect(mockedEventsService.createEvent).toHaveBeenCalledWith(
                mockRequest.body,
                'lib-1',
                mockRequest.file
            );
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(event);
        });

        it('should throw when not logged in', async () => {
            mockRequest.session = {} as any;
            mockRequest.body = { title: 'Event 1' };

            await expect(
                eventsController.createEvent(mockRequest as Request, mockResponse as Response)
            ).rejects.toMatchObject({ statusCode: 403, name: 'AuthorizationError' });
            expect(mockedEventsService.createEvent).not.toHaveBeenCalled();
        });

        it('should throw when libraryId is missing', async () => {
            (mockRequest.session as any).user = { ...sessionUser, libraryId: undefined };
            mockRequest.body = { title: 'Event 1' };

            await expect(
                eventsController.createEvent(mockRequest as Request, mockResponse as Response)
            ).rejects.toMatchObject({ statusCode: 403, name: 'AuthorizationError' });
        });
    });

    describe('updateEvent', () => {
        it('should update event', async () => {
            mockRequest.params = { id: 'e1' };
            mockRequest.body = { title: 'Updated' };
            const updated = { id: 'e1', title: 'Updated', libraryId: 'lib-1' } as any;
            mockedEventsService.updateEvent.mockResolvedValue(updated);

            await eventsController.updateEvent(mockRequest as Request, mockResponse as Response);

            expect(mockedEventsService.updateEvent).toHaveBeenCalledWith(
                'e1',
                mockRequest.body,
                'lib-1',
                'library_admin',
                mockRequest.file
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(updated);
        });
    });

    describe('getEvents', () => {
        it('should return events for library when session has libraryId', async () => {
            const events = [{ id: 'e1', title: 'Event 1', libraryId: 'lib-1' }] as any[];
            mockedEventsService.getEvents.mockResolvedValue(events);

            await eventsController.getEvents(mockRequest as Request, mockResponse as Response);

            expect(mockedEventsService.getEvents).toHaveBeenCalledWith({ libraryId: 'lib-1' });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(events);
        });

        it('should return all events when no libraryId in session', async () => {
            mockRequest.session = {} as any;
            const events = [] as any[];
            mockedEventsService.getEvents.mockResolvedValue(events);

            await eventsController.getEvents(mockRequest as Request, mockResponse as Response);

            expect(mockedEventsService.getEvents).toHaveBeenCalledWith({});
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });
    });

    describe('deleteEvent', () => {
        it('should delete event', async () => {
            mockRequest.params = { id: 'e1' };
            mockedEventsService.deleteEvent.mockResolvedValue(true);

            await eventsController.deleteEvent(mockRequest as Request, mockResponse as Response);

            expect(mockedEventsService.deleteEvent).toHaveBeenCalledWith('e1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: true });
        });
    });
});
