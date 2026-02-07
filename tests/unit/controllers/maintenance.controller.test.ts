/**
 * Unit Tests for Maintenance Controller
 */

import { Request, Response } from 'express';
import { MaintenanceController } from '../../../src/controllers/maintenance.controller';
import { maintenanceService } from '../../../src/services/maintenance.service';
import { createMockRequest, createMockResponse } from '../../helpers/mocks';

jest.mock('../../../src/services/maintenance.service');

const mockedMaintenanceService = maintenanceService as jest.Mocked<typeof maintenanceService>;

describe('MaintenanceController', () => {
    let maintenanceController: MaintenanceController;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        maintenanceController = new MaintenanceController();
        mockRequest = createMockRequest();
        mockResponse = createMockResponse();
        jest.clearAllMocks();
    });

    describe('healthCheck', () => {
        it('should return healthy status when service returns true', async () => {
            mockedMaintenanceService.healthCheck.mockResolvedValue(true);

            await maintenanceController.healthCheck(mockRequest as Request, mockResponse as Response);

            expect(mockedMaintenanceService.healthCheck).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'system healthy',
                    timestamp: expect.any(String),
                })
            );
        });

        it('should return unhealthy status when service returns false', async () => {
            mockedMaintenanceService.healthCheck.mockResolvedValue(false);

            await maintenanceController.healthCheck(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'system unhealthy',
                    timestamp: expect.any(String),
                })
            );
        });

        it('should return 500 when service throws', async () => {
            mockedMaintenanceService.healthCheck.mockRejectedValue(new Error('DB down'));

            await maintenanceController.healthCheck(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'system unhealthy',
                    error: 'Health check failed',
                    timestamp: expect.any(String),
                })
            );
        });
    });

    describe('getMaintenanceStatus', () => {
        it('should return maintenance status', async () => {
            const status = {
                maintenanceMode: false,
                systemHealth: [],
                systemMetrics: {} as any,
                maintenanceWindows: [],
                backupHistory: [],
            };
            mockedMaintenanceService.getMaintenanceStatus.mockResolvedValue(status);

            await maintenanceController.getMaintenanceStatus(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockedMaintenanceService.getMaintenanceStatus).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(status);
        });
    });

    describe('toggleMaintenanceMode', () => {
        it('should toggle maintenance mode to enabled', async () => {
            mockRequest.body = { enabled: true };
            mockedMaintenanceService.toggleMaintenanceMode.mockResolvedValue(true);

            await maintenanceController.toggleMaintenanceMode(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockedMaintenanceService.toggleMaintenanceMode).toHaveBeenCalledWith(true);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                maintenanceMode: true,
                message: 'Maintenance mode enabled',
            });
        });

        it('should toggle maintenance mode to disabled', async () => {
            mockRequest.body = { enabled: false };
            mockedMaintenanceService.toggleMaintenanceMode.mockResolvedValue(false);

            await maintenanceController.toggleMaintenanceMode(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Maintenance mode disabled' })
            );
        });
    });

    describe('scheduleMaintenance', () => {
        it('should schedule maintenance window', async () => {
            mockRequest.body = {
                title: 'Upgrade',
                scheduledStart: '2025-12-01T00:00:00Z',
            };
            const window = { id: 1, title: 'Upgrade', status: 'scheduled' } as any;
            mockedMaintenanceService.scheduleMaintenance.mockResolvedValue(window);

            await maintenanceController.scheduleMaintenance(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockedMaintenanceService.scheduleMaintenance).toHaveBeenCalledWith(mockRequest.body);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(window);
        });
    });

    describe('createBackup', () => {
        it('should create backup by type', async () => {
            mockRequest.body = { type: 'database' };
            const backup = { id: 1, type: 'database', status: 'running' } as any;
            mockedMaintenanceService.createBackup.mockResolvedValue(backup);

            await maintenanceController.createBackup(mockRequest as Request, mockResponse as Response);

            expect(mockedMaintenanceService.createBackup).toHaveBeenCalledWith('database');
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(backup);
        });
    });

    describe('getBackups', () => {
        it('should return backup list', async () => {
            const backups = [{ id: 1, type: 'full', status: 'completed' }];
            mockedMaintenanceService.getBackups.mockResolvedValue(backups as any);

            await maintenanceController.getBackups(mockRequest as Request, mockResponse as Response);

            expect(mockedMaintenanceService.getBackups).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(backups);
        });
    });

    describe('refreshSystemStatus', () => {
        it('should return refreshed system status', async () => {
            const status = { systemHealth: [] };
            mockedMaintenanceService.refreshSystemStatus.mockResolvedValue(status as any);

            await maintenanceController.refreshSystemStatus(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockedMaintenanceService.refreshSystemStatus).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(status);
        });
    });
});
