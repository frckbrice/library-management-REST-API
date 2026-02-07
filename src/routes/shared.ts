/**
 * Shared Route Utilities
 *
 * Multer config for in-memory uploads, Cloudinary upload helper, API handler
 * wrapper for async route handlers, and JSON API middleware for consistent
 * Content-Type and response shape.
 *
 * @module src/routes/shared
 */

import type { Request, Response, NextFunction } from "express";
import multer from 'multer';
import { cloudinaryService } from "../../config/bucket-storage/cloudinary";
import { formatErrorResponse, ErrorCode } from "../utils/api-response";

/** Multer instance: memory storage, 10MB max, image MIME types only. */
export const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

/**
 * Uploads a multipart file to Cloudinary under the given folder.
 *
 * @param file - Multer file (buffer + mimetype)
 * @param folder - Cloudinary folder path (e.g. 'stories', 'libraries')
 * @returns Public URL of the uploaded image, or null if Cloudinary is not configured
 * @throws Error if Cloudinary is not configured or upload fails
 */
export async function uploadImageToCloudinary(file: Express.Multer.File, folder: string): Promise<string | null> {
    if (!cloudinaryService.isReady()) {
        throw new Error('Cloudinary not configured');
    }

    try {
        const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        const result = await cloudinaryService.uploadImage(base64Image, {
            folder: `library-platform/${folder}`,
        });
        return result.url;
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw error;
    }
}

/**
 * Wraps an async route handler: sets Content-Type to application/json and
 * forwards any thrown error to next() for the global error handler.
 *
 * @param handler - Async (req, res) => Promise<void | Response> (return value is ignored)
 * @returns Express request handler
 */
export function apiHandler(handler: (req: Request, res: Response) => Promise<void | Response>) {
    return async (req: Request, res: Response, next: NextFunction) => {
        res.setHeader("Content-Type", "application/json");

        try {
            await handler(req, res);
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Middleware that sets Content-Type to application/json and overrides res.send
 * so non-JSON strings are wrapped in { message: string } for consistent API responses.
 */
export const jsonApiMiddleware = (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Content-Type', 'application/json');
    const originalSend = res.send;

    // Override the send method to always ensure proper JSON responses
    res.send = function (body: any) {
        try {
            // If body is already a string but not JSON formatted, convert it to a JSON response
            if (typeof body === 'string' && (!body.startsWith('{') && !body.startsWith('['))) {
                return originalSend.call(this, JSON.stringify({ message: body }));
            }
            return originalSend.call(this, body);
        } catch (error) {
            console.error("Error in JSON middleware:", error);
            const isProduction = process.env.NODE_ENV === "production";
            const { body } = formatErrorResponse({
                statusCode: 500,
                error: "An unexpected error occurred. Please try again or contact support.",
                code: ErrorCode.INTERNAL_ERROR,
                isProduction,
            });
            return originalSend.call(this, JSON.stringify(body));
        }
    };

    next();
};
