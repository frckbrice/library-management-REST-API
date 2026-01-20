import type { Express } from "express";

// Settings state (in production, this should be in a database)
let platformSettings = {
    general: {
        siteName: "Library Digital Platform",
        siteDescription: "A comprehensive platform for library digital experiences",
        contactEmail: "contact@library-platform.com",
        supportEmail: "support@library-platform.com",
        defaultLanguage: "en",
        timezone: "UTC",
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
        smtpHost: "",
        smtpPort: 587,
        smtpUser: "",
        smtpPassword: "",
        fromEmail: "noreply@library-platform.com",
        fromName: "Library Platform",
        enableEmailNotifications: true,
    },
    content: {
        maxFileSize: 10,
        allowedFileTypes: ["jpg", "jpeg", "png", "gif", "pdf", "mp4", "mp3"],
        autoModeration: true,
        requireApproval: true,
        enableComments: true,
        enableRatings: true,
    },
    appearance: {
        primaryColor: "#2563eb",
        secondaryColor: "#64748b",
        logo: "",
        favicon: "",
        customCSS: "",
        darkModeEnabled: true,
    },
    notifications: {
        newUserSignup: true,
        newLibraryApplication: true,
        contentFlagged: true,
        systemAlerts: true,
        weeklyReports: true,
        emailDigest: false,
    }
};

export function registerSettingsRoutes(app: Express, global_path: string) {
    // Get platform settings
    app.get(`${global_path}/settings`, async (req, res) => {
        try {
            return res.status(200).json(platformSettings);
        } catch (error) {
            console.error("Error fetching settings:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Update platform settings
    app.post(`${global_path}/settings`, async (req, res) => {
        try {
            const updates = req.body;

            // Merge updates with existing settings
            platformSettings = { ...platformSettings, ...updates };

            return res.status(200).json(platformSettings);
        } catch (error) {
            console.error("Error updating settings:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Test email configuration
    app.post(`${global_path}/settings/test-email`, async (req, res) => {
        try {
            // Simulate email test
            return res.status(200).json({ message: 'Test email sent successfully' });
        } catch (error) {
            console.error("Error testing email:", error);
            return res.status(500).json({ error: 'Failed to send test email' });
        }
    });
}
