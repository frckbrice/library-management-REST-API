import type { Express } from "express";
import drizzleService from "../../services/drizzle-services";
import { NotFoundError, AuthorizationError } from "../utils/errors";
import { requireSuperAdmin, requireLibraryAdmin } from "../../middlewares/auth";
import { upload, apiHandler, uploadImageToCloudinary } from "./shared";

export function registerLibrariesRoutes(app: Express, global_path: string) {
    app.post(`${global_path}/libraries`, requireSuperAdmin, upload.fields([
        { name: 'logo', maxCount: 1 },
        { name: 'featuredImage', maxCount: 1 }
    ]), apiHandler(async (req, res) => {

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        // Handle logo upload
        let logoUrl = req.body.logoUrl || null;
        if (files && files['logo'] && files['logo'][0]) {
            try {
                logoUrl = await uploadImageToCloudinary(files['logo'][0], 'libraries/logos');
            } catch (error) {
                return res.status(500).json({ error: 'Failed to upload logo' });
            }
        }

        // Handle featured image upload
        let featuredImageUrl = req.body.featuredImageUrl || null;
        if (files && files['featuredImage'] && files['featuredImage'][0]) {
            try {
                featuredImageUrl = await uploadImageToCloudinary(files['featuredImage'][0], 'libraries/featured');
            } catch (error) {
                return res.status(500).json({ error: 'Failed to upload featured image' });
            }
        }

        const libraryData = {
            ...req.body,
            logoUrl,
            featuredImageUrl,
            isApproved: false, // New libraries need approval
            createdAt: new Date()
        };

        const library = await drizzleService.createLibrary(libraryData);
        return res.status(201).json({
            success: true,
            data: library
        });
    }));

    // Update library with image upload
    app.patch(`${global_path}/libraries/:id`, requireLibraryAdmin, upload.fields([
        { name: 'logo', maxCount: 1 },
        { name: 'featuredImage', maxCount: 1 }
    ]), apiHandler(async (req, res) => {
        const libraryId = req.params.id;
        const existingLibrary = await drizzleService.getLibrary(libraryId);

        if (!existingLibrary) {
            throw new NotFoundError('Library');
        }

        // Check if library admin is updating their own library
        if (req.session.user!.role === 'library_admin' && req.session.user!.libraryId !== libraryId) {
            throw new AuthorizationError('You can only edit your own library');
        }

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        // Handle logo upload
        let logoUrl = req.body.logoUrl || existingLibrary.logoUrl;
        if (files && files['logo'] && files['logo'][0]) {
            try {
                logoUrl = await uploadImageToCloudinary(files['logo'][0], 'libraries/logos');
            } catch (error) {
                return res.status(500).json({ error: 'Failed to upload logo' });
            }
        }

        // Handle featured image upload
        let featuredImageUrl = req.body.featuredImageUrl || existingLibrary.featuredImageUrl;
        if (files && files['featuredImage'] && files['featuredImage'][0]) {
            try {
                featuredImageUrl = await uploadImageToCloudinary(files['featuredImage'][0], 'libraries/featured');
            } catch (error) {
                return res.status(500).json({ error: 'Failed to upload featured image' });
            }
        }

        const updateData = {
            ...req.body,
            logoUrl,
            featuredImageUrl,
            updatedAt: new Date()
        };

        const updatedLibrary = await drizzleService.updateLibrary(libraryId, updateData);
        return res.status(200).json({
            success: true,
            data: updatedLibrary
        });
    }));

    // Librarys endpoints
    app.get(`${global_path}/libraries`, async (req, res) => {
        try {
            const libraries = await drizzleService.getLibraries();
            return res.status(200).json(libraries);
        } catch (error) {
            console.error("Error fetching libraries:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Get individual library
    app.get(`${global_path}/libraries/:id`, async (req, res) => {
        try {
            const libraryId = req.params.id;
            const library = await drizzleService.getLibrary(libraryId);

            if (!library) {
                return res.status(404).json({ error: 'Library not found' });
            }

            return res.status(200).json(library);
        } catch (error) {
            console.error(`Error fetching library with ID ${req.params.id}:`, error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
}
