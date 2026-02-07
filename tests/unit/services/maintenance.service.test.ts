/**
 * Unit Tests for Maintenance Service
 */

import { MaintenanceService } from '../../../src/services/maintenance.service';
import drizzleService from '../../../src/services/drizzle-services';

jest.mock('../../../src/services/drizzle-services');

const mockedDrizzle = drizzleService as jest.Mocked<typeof drizzleService>;

describe('MaintenanceService', () => {
    let maintenanceService: MaintenanceService;

    beforeEach(() => {
        maintenanceService = new MaintenanceService();
        jest.clearAllMocks();
    });

    describe('healthCheck', () => {
        it('should return true when drizzle healthCheck succeeds', async () => {
            mockedDrizzle.healthCheck.mockResolvedValue(true as any);

            const result = await maintenanceService.healthCheck();
            expect(mockedDrizzle.healthCheck).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('should return false when drizzle healthCheck fails', async () => {
            mockedDrizzle.healthCheck.mockResolvedValue(false as any);

            const result = await maintenanceService.healthCheck();
            expect(result).toBe(false);
        });
    });

    describe('getMaintenanceStatus', () => {
        it('should return status with systemHealth and metrics', async () => {
            const result = await maintenanceService.getMaintenanceStatus();

            expect(result).toHaveProperty('maintenanceMode');
            expect(result).toHaveProperty('systemHealth');
            expect(result).toHaveProperty('systemMetrics');
            expect(result).toHaveProperty('maintenanceWindows');
            expect(result).toHaveProperty('backupHistory');
            expect(Array.isArray(result.systemHealth)).toBe(true);
            expect(result.systemMetrics).toHaveProperty('cpuUsage');
            expect(result.systemMetrics).toHaveProperty('memoryUsage');
        });
    });

    describe('toggleMaintenanceMode', () => {
        it('should set maintenance mode to true', async () => {
            const result = await maintenanceService.toggleMaintenanceMode(true);
            expect(result).toBe(true);
        });

        it('should set maintenance mode to false', async () => {
            await maintenanceService.toggleMaintenanceMode(true);
            const result = await maintenanceService.toggleMaintenanceMode(false);
            expect(result).toBe(false);
        });
    });

    describe('scheduleMaintenance', () => {
        it('should create maintenance window', async () => {
            const data = {
                title: 'Upgrade',
                scheduledStart: '2025-12-01T00:00:00Z',
                description: 'DB upgrade',
            };

            const result = await maintenanceService.scheduleMaintenance(data);

            expect(result).toHaveProperty('id');
            expect(result.title).toBe('Upgrade');
            expect(result.description).toBe('DB upgrade');
            expect(result.status).toBe('scheduled');
            expect(result.scheduledStart).toEqual(new Date(data.scheduledStart));
        });

        it('should throw when title or start missing', async () => {
            await expect(
                maintenanceService.scheduleMaintenance({} as any)
            ).rejects.toThrow('Title and start time are required');
            await expect(
                maintenanceService.scheduleMaintenance({ title: 'X' } as any)
            ).rejects.toThrow('Title and start time are required');
        });
    });

    describe('createBackup', () => {
        it('should create backup for valid type', async () => {
            const result = await maintenanceService.createBackup('database');

            expect(result).toHaveProperty('id');
            expect(result.type).toBe('database');
            expect(result.status).toBe('running');
            expect(['database', 'files', 'full']).toContain(result.type);
        });

        it('should throw for invalid backup type', async () => {
            await expect(maintenanceService.createBackup('invalid' as any)).rejects.toThrow(
                'Invalid backup type'
            );
        });
    });

    describe('getBackups', () => {
        it('should return backup history', async () => {
            const result = await maintenanceService.getBackups();
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('refreshSystemStatus', () => {
        it('should return systemHealth', async () => {
            const result = await maintenanceService.refreshSystemStatus();
            expect(result).toHaveProperty('systemHealth');
            expect(Array.isArray(result.systemHealth)).toBe(true);
        });
    });
});
