/**
 * Unit Tests for Contact Service
 */

import { ContactService } from '../../../src/services/contact.service';
import drizzleService from '../../../src/services/drizzle-services';
import { sendResponseEmail } from '../../../src/services/email-service';

jest.mock('../../../src/services/drizzle-services');
jest.mock('../../../src/services/email-service');
jest.mock('../../../src/middlewares/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const mockedDrizzle = drizzleService as jest.Mocked<typeof drizzleService>;
const mockedSendEmail = sendResponseEmail as jest.MockedFunction<typeof sendResponseEmail>;

describe('ContactService', () => {
    let contactService: ContactService;

    beforeEach(() => {
        contactService = new ContactService();
        jest.clearAllMocks();
    });

    describe('getContactMessages', () => {
        it('should return messages for libraryId when provided', async () => {
            const messages = [{ id: 'm1', libraryId: 'lib-1' }];
            mockedDrizzle.getContactMessages.mockResolvedValue(messages as any);

            const result = await contactService.getContactMessages('lib-1');
            expect(mockedDrizzle.getContactMessages).toHaveBeenCalledWith({ libraryId: 'lib-1' });
            expect(result).toEqual(messages);
        });

        it('should return all messages when libraryId undefined', async () => {
            mockedDrizzle.getContactMessages.mockResolvedValue([]);
            await contactService.getContactMessages(undefined);
            expect(mockedDrizzle.getContactMessages).toHaveBeenCalledWith({});
        });
    });

    describe('createContactMessage', () => {
        it('should create and return message', async () => {
            const data = { name: 'John', email: 'j@test.com', subject: 'Hi', message: 'Hello' };
            const created = { id: 'm1', ...data };
            mockedDrizzle.createContactMessage.mockResolvedValue(created as any);

            const result = await contactService.createContactMessage(data as any);
            expect(mockedDrizzle.createContactMessage).toHaveBeenCalledWith(data);
            expect(result).toEqual(created);
        });
    });

    describe('updateContactMessage', () => {
        it('should update and return message', async () => {
            const updated = { id: 'm1', isRead: true };
            mockedDrizzle.updateContactMessage.mockResolvedValue(updated as any);

            const result = await contactService.updateContactMessage('m1', { isRead: true });
            expect(mockedDrizzle.updateContactMessage).toHaveBeenCalledWith('m1', { isRead: true });
            expect(result).toEqual(updated);
        });

        it('should throw NotFoundError when message not found', async () => {
            mockedDrizzle.updateContactMessage.mockResolvedValue(undefined as any);

            await expect(
                contactService.updateContactMessage('m1', { isRead: true })
            ).rejects.toMatchObject({ message: 'Contact message not found', statusCode: 404, name: 'NotFoundError' });
        });
    });

    describe('replyToMessage', () => {
        it('should throw when subject or message missing', async () => {
            await expect(
                contactService.replyToMessage('m1', '', 'body', 'u1', 'lib-1')
            ).rejects.toThrow('Subject and message are required');
            await expect(
                contactService.replyToMessage('m1', 'Sub', '', 'u1', 'lib-1')
            ).rejects.toThrow('Subject and message are required');
        });

        it('should throw NotFoundError when message not found or wrong library', async () => {
            mockedDrizzle.getContactMessage.mockResolvedValue(undefined as any);

            await expect(
                contactService.replyToMessage('m1', 'Re', 'Msg', 'u1', 'lib-1')
            ).rejects.toMatchObject({ message: 'Message not found', statusCode: 404 });
        });

        it('should throw when message belongs to different library', async () => {
            mockedDrizzle.getContactMessage.mockResolvedValue({
                id: 'm1',
                libraryId: 'other-lib',
            } as any);

            await expect(
                contactService.replyToMessage('m1', 'Re', 'Msg', 'u1', 'lib-1')
            ).rejects.toMatchObject({ message: 'Message not found', statusCode: 404 });
        });
    });
});
