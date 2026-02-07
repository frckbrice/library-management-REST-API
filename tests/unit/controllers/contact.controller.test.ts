/**
 * Unit Tests for Contact Controller
 */

import { Request, Response } from 'express';
import { ContactController } from '../../../src/controllers/contact.controller';
import { contactService } from '../../../src/services/contact.service';
import { AuthorizationError } from '../../../src/utils/errors';
import { createMockRequest, createMockResponse, createMockSession } from '../../helpers/mocks';

jest.mock('../../../src/services/contact.service');

const mockedContactService = contactService as jest.Mocked<typeof contactService>;

describe('ContactController', () => {
    let contactController: ContactController;
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
        contactController = new ContactController();
        mockRequest = createMockRequest();
        mockResponse = createMockResponse();
        mockRequest.session = createMockSession(sessionUser) as any;
        jest.clearAllMocks();
    });

    describe('getContactMessages', () => {
        it('should return contact messages for library', async () => {
            const messages = [{ id: 'm1', subject: 'Hello', libraryId: 'lib-1' }] as any[];
            mockedContactService.getContactMessages.mockResolvedValue(messages);

            await contactController.getContactMessages(mockRequest as Request, mockResponse as Response);

            expect(mockedContactService.getContactMessages).toHaveBeenCalledWith('lib-1');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(messages);
        });
    });

    describe('createContactMessage', () => {
        it('should create contact message', async () => {
            const body = { name: 'John', email: 'j@test.com', subject: 'Hi', message: 'Hello' };
            mockRequest.body = body;
            const created = { id: 'm1', ...body } as any;
            mockedContactService.createContactMessage.mockResolvedValue(created);

            await contactController.createContactMessage(mockRequest as Request, mockResponse as Response);

            expect(mockedContactService.createContactMessage).toHaveBeenCalledWith(body);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(created);
        });
    });

    describe('updateContactMessage', () => {
        it('should update contact message', async () => {
            mockRequest.params = { id: 'm1' };
            mockRequest.body = { isRead: true };
            const updated = { id: 'm1', isRead: true } as any;
            mockedContactService.updateContactMessage.mockResolvedValue(updated);

            await contactController.updateContactMessage(mockRequest as Request, mockResponse as Response);

            expect(mockedContactService.updateContactMessage).toHaveBeenCalledWith('m1', { isRead: true });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(updated);
        });
    });

    describe('replyToMessage', () => {
        it('should reply when user is library_admin', async () => {
            mockRequest.params = { id: 'm1' };
            mockRequest.body = { subject: 'Re: Hi', message: 'Reply text' };
            const response = { id: 'r1', subject: 'Re: Hi', message: 'Reply text' } as any;
            mockedContactService.replyToMessage.mockResolvedValue(response);

            await contactController.replyToMessage(mockRequest as Request, mockResponse as Response);

            expect(mockedContactService.replyToMessage).toHaveBeenCalledWith(
                'm1',
                'Re: Hi',
                'Reply text',
                'user-1',
                'lib-1'
            );
            expect(mockResponse.json).toHaveBeenCalledWith(response);
        });

        it('should throw AuthorizationError when not library_admin', async () => {
            (mockRequest.session as any).user = { ...sessionUser, role: 'viewer' };

            await expect(
                contactController.replyToMessage(mockRequest as Request, mockResponse as Response)
            ).rejects.toMatchObject({ statusCode: 403, name: 'AuthorizationError' });
            expect(mockedContactService.replyToMessage).not.toHaveBeenCalled();
        });

        it('should throw AuthorizationError when no user in session', async () => {
            mockRequest.session = {} as any;

            await expect(
                contactController.replyToMessage(mockRequest as Request, mockResponse as Response)
            ).rejects.toMatchObject({ statusCode: 403, name: 'AuthorizationError' });
        });
    });
});
