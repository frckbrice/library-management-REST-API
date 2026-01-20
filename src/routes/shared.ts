import type { Request, Response, NextFunction } from "express";
import multer from 'multer';
import { cloudinaryService } from "../../config/bucket-storage/cloudinary";

// Configure multer for memory storage
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

// Helper function to upload image to Cloudinary
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

// API wrapper to ensure JSON responses
export function apiHandler(handler: (req: Request, res: Response) => Promise<any>) {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Always set JSON content type
        res.setHeader('Content-Type', 'application/json');

        try {
            await handler(req, res);
        } catch (error) {
            console.error("API Error:", error);
            res.status(500).json({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : String(error)
            });
        }
    };
}

// Create a middleware to ensure all API responses are JSON
export const jsonApiMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Set the content type before any response is sent
    res.setHeader('Content-Type', 'application/json');

    // Store the original res.send method
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
            return originalSend.call(this, JSON.stringify({ error: "Internal server error" }));
        }
    };

    next();
};
