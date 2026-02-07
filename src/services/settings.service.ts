/**
 * Settings Service
 *
 * Get/update platform settings and test email. State is in-memory; in
 * production should be persisted (e.g. database).
 *
 * @module src/services/settings.service
 */

/** In-memory platform settings; prefer database in production. */
let platformSettings = {
  general: {
    siteName: 'Library Digital Platform',
    siteDescription: 'A comprehensive platform for library digital experiences',
    contactEmail: 'contact@library-platform.com',
    supportEmail: 'support@library-platform.com',
    defaultLanguage: 'en',
    timezone: 'UTC',
    allowRegistration: true,
    requireEmailVerification: true,
    maintenanceMode: false,
  },
  security: {
    passwordMinLength: 8,
    requireStrongPasswords: true,
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    enableTwoFactor: false,
    allowPasswordReset: true,
  },
  email: {
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: 'noreply@library-platform.com',
    fromName: 'Library Platform',
    enableEmailNotifications: true,
  },
  content: {
    maxFileSize: 10,
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'mp4', 'mp3'],
    autoModeration: true,
    requireApproval: true,
    enableComments: true,
    enableRatings: true,
  },
  appearance: {
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    logo: '',
    favicon: '',
    customCSS: '',
    darkModeEnabled: true,
  },
  notifications: {
    newUserSignup: true,
    newLibraryApplication: true,
    contentFlagged: true,
    systemAlerts: true,
    weeklyReports: true,
    emailDigest: false,
  },
};

export type PlatformSettings = typeof platformSettings;

export class SettingsService {
  /** Returns current platform settings (in-memory). */
  async getSettings(): Promise<PlatformSettings> {
    return platformSettings;
  }

  /** Merges updates into platform settings and returns the result. */
  async updateSettings(updates: Partial<PlatformSettings>): Promise<PlatformSettings> {
    // Merge updates with existing settings
    platformSettings = { ...platformSettings, ...updates };
    return platformSettings;
  }

  /** Simulates sending a test email; returns success message. */
  /** Simulates sending a test email; returns success message. */
  async testEmail(): Promise<{ message: string }> {
    // Simulate email test
    return { message: 'Test email sent successfully' };
  }
}

export const settingsService = new SettingsService();
