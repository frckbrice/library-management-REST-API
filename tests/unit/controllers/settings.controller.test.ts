/**
 * Unit Tests for Settings Controller
 */

import { Request, Response } from 'express';
import { SettingsController } from '../../../src/controllers/settings.controller';
import { settingsService } from '../../../src/services/settings.service';
import { createMockRequest, createMockResponse } from '../../helpers/mocks';

jest.mock('../../../src/services/settings.service');

const mockedSettingsService = settingsService as jest.Mocked<typeof settingsService>;

describe('SettingsController', () => {
    let settingsController: SettingsController;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        settingsController = new SettingsController();
        mockRequest = createMockRequest();
        mockResponse = createMockResponse();
        jest.clearAllMocks();
    });

    describe('getSettings', () => {
        it('should return platform settings', async () => {
            const settings = { general: { siteName: 'Test' }, security: {}, email: {}, content: {}, appearance: {}, notifications: {} } as any;
            mockedSettingsService.getSettings.mockResolvedValue(settings);

            await settingsController.getSettings(mockRequest as Request, mockResponse as Response);

            expect(mockedSettingsService.getSettings).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(settings);
        });
    });

    describe('updateSettings', () => {
        it('should update settings with body', async () => {
            mockRequest.body = { general: { siteName: 'Updated Name' } };
            const updated = { general: { siteName: 'Updated Name' } } as any;
            mockedSettingsService.updateSettings.mockResolvedValue(updated);

            await settingsController.updateSettings(mockRequest as Request, mockResponse as Response);

            expect(mockedSettingsService.updateSettings).toHaveBeenCalledWith(mockRequest.body);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(updated);
        });
    });

    describe('testEmail', () => {
        it('should return test email result', async () => {
            const result = { message: 'Test email sent successfully' };
            mockedSettingsService.testEmail.mockResolvedValue(result);

            await settingsController.testEmail(mockRequest as Request, mockResponse as Response);

            expect(mockedSettingsService.testEmail).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(result);
        });
    });
});
