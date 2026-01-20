import { v2 as cloudinary } from 'cloudinary';

interface CloudinaryConfig {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    folder?: string;
}

class CloudinaryService {
    private isConfigured = false;

    configure(config: CloudinaryConfig) {
        cloudinary.config({
            cloud_name: config.cloudName,
            api_key: config.apiKey,
            api_secret: config.apiSecret,
        });
        this.isConfigured = true;
    }

    isReady(): boolean {
        return this.isConfigured;
    }

    async uploadImage(
        file: string,
        options: {
            folder?: string;
            public_id?: string;
            transformation?: any;
            tags?: string[];
        } = {}
    ): Promise<any> {
        if (!this.isConfigured) {
            throw new Error('Cloudinary not configured. Please set up your credentials in settings.');
        }

        try {
            const result = await cloudinary.uploader.upload(file as any, {
                folder: options.folder || 'library-platform',
                public_id: options.public_id,
                transformation: options.transformation,
                tags: options.tags,
                resource_type: 'auto',
            });

            return {
                url: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format,
                bytes: result.bytes,
            };
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            throw new Error('Failed to upload image to Cloudinary');
        }
    }

    async deleteImage(publicId: string): Promise<boolean> {
        if (!this.isConfigured) {
            throw new Error('Cloudinary not configured');
        }

        try {
            const result = await cloudinary.uploader.destroy(publicId);
            return result.result === 'ok';
        } catch (error) {
            console.error('Cloudinary delete error:', error);
            return false;
        }
    }

    generateUrl(publicId: string, transformation?: any): string {
        if (!this.isConfigured) {
            throw new Error('Cloudinary not configured');
        }

        return cloudinary.url(publicId, {
            transformation,
            secure: true,
        });
    }
}

export const cloudinaryService = new CloudinaryService();

// Initialize from environment variables if available
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinaryService.configure({
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
    });
}