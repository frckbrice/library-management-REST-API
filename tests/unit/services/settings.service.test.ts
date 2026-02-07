/**
 * Unit Tests for Settings Service
 */

import { SettingsService } from '../../../src/services/settings.service';

describe('SettingsService', () => {
    let settingsService: SettingsService;

    beforeEach(() => {
        settingsService = new SettingsService();
    });

    describe('getSettings', () => {
        it('should return platform settings', async () => {
            const result = await settingsService.getSettings();

            expect(result).toHaveProperty('general');
            expect(result).toHaveProperty('security');
            expect(result).toHaveProperty('email');
            expect(result).toHaveProperty('content');
            expect(result).toHaveProperty('appearance');
            expect(result).toHaveProperty('notifications');
            expect(result.general).toHaveProperty('siteName');
            expect(result.general).toHaveProperty('timezone');
        });
    });

    describe('updateSettings', () => {
        it('should merge and return updated settings', async () => {
            const updates = { general: { siteName: 'Updated Platform Name' } };
            const result = await settingsService.updateSettings(updates as any);

            expect(result.general.siteName).toBe('Updated Platform Name');
        });
    });

    describe('testEmail', () => {
        it('should return success message', async () => {
            const result = await settingsService.testEmail();

            expect(result).toEqual({ message: 'Test email sent successfully' });
        });
    });
});
