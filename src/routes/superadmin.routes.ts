import type { Express } from "express";
import drizzleService from "../../services/drizzle-services";
import bcrypt from "bcrypt";

export function registerSuperAdminRoutes(app: Express, global_path: string) {
    // Super Admin stats endpoint
    app.get(`${global_path}/sadmin/stats`, async (req, res) => {
        try {
            // Get counts of various entities for the dashboard
            const libraries = await drizzleService.getLibraries();
            const stories = await drizzleService.getStories();
            const mediaItems = await drizzleService.getMediaItems();
            const usersPromises = libraries.map(library => drizzleService.getUsersByLibraryId(library.id));
            const usersArrays = await Promise.all(usersPromises);
            const users = usersArrays.flat();

            // Sample placeholder data - in a real app this would come from actual data
            const stats = {
                totalLibraries: libraries.length,
                pendingLibraries: libraries.filter(m => !m.isApproved).length,
                totalStories: stories.length,
                pendingStories: stories.filter(s => !s.isApproved).length,
                totalMedia: mediaItems.length,
                uniqueGalleries: Array.from(new Set(mediaItems.map(m => m.galleryId))).length,
                totalUsers: users.length,
                activeUsers: users.filter(u => u.lastLoginAt !== null).length,
                recentActivity: [
                    { type: 'user_signup', user: 'National Gallery Admin', timestamp: new Date(Date.now() - 1000 * 60 * 5) },
                    { type: 'story_published', user: 'MoMA Admin', title: 'Summer Exhibition Preview', timestamp: new Date(Date.now() - 1000 * 60 * 60) },
                    { type: 'media_uploaded', user: 'Louvre Admin', count: 15, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3) },
                    { type: 'library_approved', user: 'Super Admin', library: 'Contemporary Arts Center', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) }
                ]
            };

            return res.status(200).json(stats);
        } catch (error) {
            console.error("Error fetching super admin stats:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Super Admin moderation endpoints
    app.get(`${global_path}/superadmin/moderation/stories`, async (req, res) => {
        try {
            // Get stories that need approval
            const pendingStories = await drizzleService.getStories({ approved: false });
            return res.status(200).json(pendingStories);
        } catch (error) {
            console.error("Error fetching pending stories:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get(`${global_path}/superadmin/moderation/media`, async (req, res) => {
        try {
            // Get media items that need approval
            const pendingMedia = await drizzleService.getMediaItems({ approved: false });
            return res.status(200).json(pendingMedia);
        } catch (error) {
            console.error("Error fetching pending media:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.patch(`${global_path}/superadmin/stories/:id/approve`, async (req, res) => {
        try {
            const storyId = req.params.id;
            // Fix DB column mismatch by using appropriate naming
            const updatedStory = await drizzleService.updateStory(storyId, {
                isApproved: true // Keep using isApproved as this is for the DB field name
            });

            if (!updatedStory) {
                return res.status(404).json({ error: 'Story not found' });
            }

            return res.status(200).json(updatedStory);
        } catch (error) {
            console.error("Error approving story:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.patch(`${global_path}/superadmin/stories/:id/reject`, async (req, res) => {
        try {
            const storyId = req.params.id;
            const updatedStory = await drizzleService.updateStory(storyId, { isApproved: false });

            if (!updatedStory) {
                return res.status(404).json({ error: 'Story not found' });
            }

            return res.status(200).json(updatedStory);
        } catch (error) {
            console.error("Error rejecting story:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.patch(`${global_path}/superadmin/media-items/:id/approve`, async (req, res) => {
        try {
            const mediaId = req.params.id;
            const updatedMedia = await drizzleService.updateMediaItem(mediaId, { isApproved: true });

            if (!updatedMedia) {
                return res.status(404).json({ error: 'Media item not found' });
            }

            return res.status(200).json(updatedMedia);
        } catch (error) {
            console.error("Error approving media:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.patch(`${global_path}/superadmin/media-items/:id/reject`, async (req, res) => {
        try {
            const mediaId = req.params.id;
            const updatedMedia = await drizzleService.updateMediaItem(mediaId, { isApproved: false });

            if (!updatedMedia) {
                return res.status(404).json({ error: 'Media item not found' });
            }

            return res.status(200).json(updatedMedia);
        } catch (error) {
            console.error("Error rejecting media:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Super Admin libraries endpoint
    app.get(`${global_path}/superadmin/libraries`, async (req, res) => {
        try {
            const libraries = await drizzleService.getLibraries();
            return res.status(200).json(libraries);
        } catch (error) {
            console.error("Error fetching libraries:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Super Admin users endpoint
    app.get(`${global_path}/superadmin/users`, async (req, res) => {
        try {
            // Get all users across all libraries
            const libraries = await drizzleService.getLibraries();
            const usersPromises = libraries.map(library => drizzleService.getUsersByLibraryId(library.id));
            const usersArrays = await Promise.all(usersPromises);
            const users = usersArrays.flat();

            return res.status(200).json(users);
        } catch (error) {
            console.error("Error fetching users:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.post(`${global_path}/superadmin/users`, async (req, res) => {
        try {
            const userData = req.body;

            // Validate required fields
            if (!userData.username || !userData.password || !userData.email || !userData.fullName || !userData.role) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10);

            const newUser = await drizzleService.createUser({
                username: userData.username,
                password: hashedPassword,
                email: userData.email,
                fullName: userData.fullName,
                role: userData.role,
                libraryId: userData.libraryId || null,
                isActive: userData.isActive !== undefined ? userData.isActive : true
            });

            return res.status(201).json(newUser);
        } catch (error: any) {
            console.error("Error creating user:", error);

            // Handle duplicate username/email errors
            if (error.code === '23505') { // PostgreSQL unique violation code
                if (error.constraint === 'users_username_unique') {
                    return res.status(409).json({
                        error: 'Username already in use. Please choose a different one.'
                    });
                }
                if (error.constraint === 'users_email_unique') {
                    return res.status(409).json({
                        error: 'Email already in use. Please use a different email.'
                    });
                }
            }

            return res.status(500).json({ error: error?.message || 'Internal server error' });
        }
    });

    app.patch(`${global_path}/superadmin/users/:id`, async (req, res) => {
        try {
            const userId = req.params.id;
            const updateData = req.body;

            const updatedUser = await drizzleService.updateUser(userId, updateData);

            if (!updatedUser) {
                return res.status(404).json({ error: 'User not found' });
            }

            return res.status(200).json(updatedUser);
        } catch (error) {
            console.error("Error updating user:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.post(`${global_path}/superadmin/users/:id/reset-password`, async (req, res) => {
        try {
            const userId = req.params.id;
            const { password } = req.body;

            if (!password) {
                return res.status(400).json({ error: 'Password is required' });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(password, 10);

            const updatedUser = await drizzleService.updateUser(userId, { password: hashedPassword });

            if (!updatedUser) {
                return res.status(404).json({ error: 'User not found' });
            }

            return res.status(200).json({ message: 'Password reset successfully' });
        } catch (error) {
            console.error("Error resetting password:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
}
