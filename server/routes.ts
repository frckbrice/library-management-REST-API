import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import drizzleService from "../services/drizzle-services";
import { compare } from "bcrypt";

import { logEvents } from "../middlewares/logger";
import bcrypt from "bcrypt";
import { sendResponseEmail } from "../services/email-service";
import { Story } from "../config/database/schema";
import { cloudinaryService } from "../config/bucket-storage/cloudinary";
import multer from 'multer';

import {
  generalApiLimiter,
  authLimiter,
  contactLimiter,
  uploadLimiter,
  adminLimiter,
  publicLimiter,
  emailLimiter,
  searchLimiter
} from '../middlewares/rate-limiters';

// Configure multer for memory storage
const upload = multer({
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
async function uploadImageToCloudinary(file: Express.Multer.File, folder: string): Promise<string | null> {
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
function apiHandler(handler: (req: Request, res: Response) => Promise<any>) {
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
const jsonApiMiddleware = (req: Request, res: Response, next: NextFunction) => {
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

export async function registerRoutes(global_path: string, app: Express): Promise<Server> {
  // Apply JSON API middleware to all API routes
  app.use(global_path, jsonApiMiddleware);
  app.use(global_path, generalApiLimiter);

  app.use(global_path + '/libraries', publicLimiter);
  app.use(global_path + '/stories', publicLimiter);
  app.use(global_path + '/events', publicLimiter);
  app.use(global_path + '/media-items', publicLimiter);

  // Apply stricter rate limiting to admin routes
  app.use(global_path + '/admin', adminLimiter);

  // Apply search rate limiting to search endpoints
  app.get('/api/libraries', (req, res, next) => {
    if (req.query.search) {
      return searchLimiter(req, res, next);
    }
    next();
  });

  app.get('/api/stories', (req, res, next) => {
    if (req.query.search) {
      return searchLimiter(req, res, next);
    }
    next();
  });

  // Authentication routes
  app.post(`${global_path}/auth/login`, async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const user = await drizzleService.getUserByUsername(username);

      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Compare password using bcrypt
      const passwordMatch = await compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Create session data
      req.session.user = {
        id: user.id as string,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        libraryId: String(user.libraryId)
      };

      // we must create a token here with user data

      // return 
      return res.status(200).json({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        libraryId: user.libraryId
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get(`${global_path}/auth/session`, (req, res) => {
    if (req.session.user) {
      return res.status(200).json(req.session.user);
    }
    return res.status(200).json(null);
  });

  app.post(`${global_path}/auth/logout`, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({ success: true });
    });
  });

  // Admin story management endpoints
  app.post(`${global_path}/admin/stories`, upload.single('featuredImage'), apiHandler(async (req, res) => {
    // For testing - remove after
    console.log("Session user:", req.session.user);

    // Temporarily allow any role for testing
    if (!req.session.user) {
      return res.status(403).json({ error: 'Unauthorized - not logged in' });
    }

    console.log("Creating story with data:", req.body);

    // Create story with library ID from session user or use default for testing
    const libraryId = req.session.user.libraryId || 1;

    // Handle featured image upload
    let featuredImageUrl = req.body.featuredImageUrl || null;
    if (req.file) {
      try {
        featuredImageUrl = await uploadImageToCloudinary(req.file, 'stories');
      } catch (error) {
        return res.status(500).json({ error: 'Failed to upload featured image' });
      }
    }

    // Create story with library ID from session user
    const storyData = {
      ...req.body,
      libraryId,
      featuredImageUrl,
      isApproved: false, // New stories need approval
      isPublished: req.body.isPublished || false,
      isFeatured: false, // Only super admin can feature stories
      createdAt: new Date()
    };

    const story = await drizzleService.createStory(storyData);
    console.log("Story created successfully:", story);
    return res.status(200).json(story);
  }));

  // Admin story update endpoint
  app.patch(`${global_path}/admin/stories/:id`, upload.single('featuredImage'), apiHandler(async (req, res) => {
    // Temporarily relax the role check for testing
    if (!req.session.user) {
      return res.status(403).json({ error: 'Unauthorized - not logged in' });
    }

    const storyId = req.params.id;

    // Get the story first to verify ownership
    const existingStory = await drizzleService.getStory(storyId);

    if (!existingStory) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Get libraryId from session or fallback for testing
    const libraryId = req.session.user.libraryId || existingStory.libraryId;

    // Only do ownership check if we have a proper role
    if (req.session.user.role === 'library_admin' && existingStory.libraryId !== libraryId) {
      return res.status(403).json({ error: 'Unauthorized - you can only edit stories for your library' });
    }

    // Handle featured image upload
    let featuredImageUrl = req.body.featuredImageUrl || existingStory.featuredImageUrl;
    if (req.file) {
      try {
        featuredImageUrl = await uploadImageToCloudinary(req.file, 'stories');
      } catch (error) {
        return res.status(500).json({ error: 'Failed to upload featured image' });
      }
    }

    // Preserve approval status - only super admin can change this
    const updateData = {
      ...req.body,
      featuredImageUrl,
      isApproved: existingStory.isApproved, // Preserve approval status
      updatedAt: new Date()
    };

    const updatedStory = await drizzleService.updateStory(storyId, updateData);
    console.log("Story updated successfully:", updatedStory);
    return res.status(200).json(updatedStory);
  }));

  // Admin get single story endpoint
  app.get(`${global_path}/admin/stories/:id`, apiHandler(async (req, res) => {
    // Relaxed authentication for testing
    if (!req.session.user) {
      return res.status(403).json({ error: 'Unauthorized - not logged in' });
    }

    const storyId = req.params.id;
    const story = await drizzleService.getStory(storyId);

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    console.log("Found story for editing:", story);
    return res.status(200).json(story);
  }));

  // Admin timelines endpoints
  app.get(`${global_path}/admin/stories/:id/timelines`, apiHandler(async (req, res) => {
    // Relaxed authentication for testing
    if (!req.session.user) {
      return res.status(403).json({ error: 'Unauthorized - not logged in' });
    }

    const storyId = req.params.id;

    // Get the story first to verify ownership
    const story = await drizzleService.getStory(storyId);

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Skip ownership check for testing
    // Get the timelines
    const timelines = await drizzleService.getTimelinesByStoryId(storyId);
    console.log("Retrieved timelines:", timelines);
    return res.status(200).json(timelines);
  }));

  app.post(`${global_path}/admin/stories/:id/timelines`, apiHandler(async (req, res) => {
    // Relaxed authentication for testing
    if (!req.session.user) {
      return res.status(403).json({ error: 'Unauthorized - not logged in' });
    }

    const storyId = req.params.id;

    // Get the story first to verify it exists
    const story = await drizzleService.getStory(storyId);

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Create timeline data
    const timelineData = {
      ...req.body,
      storyId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log("Creating timeline with data:", timelineData);
    const timeline = await drizzleService.createTimeline(timelineData);
    console.log("Timeline created successfully:", timeline);
    return res.status(200).json(timeline);
  }));



  // Stories endpoints
  app.get(`${global_path}/stories`, async (req, res) => {
    try {
      // Extract query parameters
      const libraryId = req.query.libraryId ? String(req.query.libraryId) : undefined;

      // Handle boolean parameters properly - undefined if not provided, explicit boolean if provided
      let published = undefined;
      if (req.query.published !== undefined) {
        published = req.query.published === 'true';
      }

      let approved = undefined;
      if (req.query.approved !== undefined) {
        approved = req.query.approved === 'true';
      }

      let featured = undefined;
      if (req.query.featured !== undefined) {
        featured = req.query.featured === 'true';
      }

      const tags = req.query.tag ? Array.isArray(req.query.tag) ? req.query.tag as string[] : [req.query.tag as string] : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const offset = req.query.offset ? Number(req.query.offset) : undefined;

      // Pass parameters to storage method with appropriate naming
      const stories = await drizzleService.getStories({
        libraryId,
        published,
        approved, // Fixed to use the correct parameter name for the storage interface
        featured,
        tags,
        limit,
        offset
      });

      return res.status(200).json(stories);
    } catch (error) {
      console.error("Error fetching stories:", error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get individual story
  app.get(`${global_path}/stories/:id`, async (req, res) => {
    try {
      // Skip the tags endpoint - special case
      if (req.params.id === 'tags') {
        // Get all stories
        const allStories = await drizzleService.getStories();

        // Extract all unique tags
        const uniqueTags = new Set<string>();
        allStories.forEach((story: Story) => {
          if (story.tags && Array.isArray(story.tags)) {
            story.tags.forEach((tag: string) => {
              if (tag) uniqueTags.add(tag);
            });
          }
        });

        return res.status(200).json(Array.from(uniqueTags));
      }

      console.log("hit specific story with id : ", req.params.id)
      // Regular story lookup by ID
      const storyId = req.params.id;
      const story = await drizzleService.getStory(storyId);

      if (!story) {
        return res.status(404).json({ error: 'Story not found' });
      }

      return res.status(200).json(story);
    } catch (error) {
      console.error(`Error fetching story with ID ${req.params.id}:`, error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post(`${global_path}/libraries`, upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'featuredImage', maxCount: 1 }
  ]), apiHandler(async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Unauthorized - super admin required' });
    }

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
    return res.status(201).json(library);
  }));

  // Update library with image upload
  app.patch(`${global_path}/libraries/:id`, upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'featuredImage', maxCount: 1 }
  ]), apiHandler(async (req, res) => {
    if (!req.session.user || (req.session.user.role !== 'super_admin' && req.session.user.role !== 'library_admin')) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const libraryId = req.params.id;
    const existingLibrary = await drizzleService.getLibrary(libraryId);

    if (!existingLibrary) {
      return res.status(404).json({ error: 'Library not found' });
    }

    // Check if library admin is updating their own library
    if (req.session.user.role === 'library_admin' && req.session.user.libraryId !== libraryId) {
      return res.status(403).json({ error: 'Unauthorized - you can only edit your own library' });
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
    return res.status(200).json(updatedLibrary);
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

  // Media endpoints
  app.get(`${global_path}/media-items`, async (req, res) => {
    try {
      // Extract query parameters
      const libraryId = req.query.libraryId ? String(req.query.libraryId) : undefined;
      const galleryId = req.query.galleryId ? String(req.query.galleryId) : undefined;

      // Handle boolean parameters properly - undefined if not provided, explicit boolean if provided
      let approved = undefined;
      if (req.query.approved !== undefined) {
        approved = req.query.approved === 'true';
      }

      const mediaType = req.query.mediaType ? String(req.query.mediaType) : undefined;
      const tags = req.query.tag ? Array.isArray(req.query.tag) ? req.query.tag as string[] : [req.query.tag as string] : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const offset = req.query.offset ? Number(req.query.offset) : undefined;

      // Pass parameters to storage method with appropriate naming
      const media = await drizzleService.getMediaItems({
        libraryId,
        galleryId,
        mediaType,
        tags,
        limit,
        offset,
        approved // Fixed to use the correct parameter name for the storage interface
      });

      return res.status(200).json(media);
    } catch (error) {
      console.error("Error fetching media:", error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get individual media item
  app.get(`${global_path}/media-items/:id`, async (req, res) => {
    try {
      const mediaId = req.params.id;
      const mediaItem = await drizzleService.getMediaItem(mediaId);

      if (!mediaItem) {
        return res.status(404).json({ error: 'Media item not found' });
      }

      return res.status(200).json(mediaItem);
    } catch (error) {
      console.error(`Error fetching media item with ID ${req.params.id}:`, error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post(`${global_path}/media-items`, upload.single('mediaFile'), apiHandler(async (req, res) => {
    if (!req.session.user) {
      return res.status(403).json({ error: 'Unauthorized - not logged in' });
    }

    const libraryId = req.session.user.libraryId;
    if (!libraryId) {
      return res.status(400).json({ error: 'Library ID required' });
    }

    // Handle media file upload
    let url = req.body.url || null;
    if (req.file) {
      try {
        url = await uploadImageToCloudinary(req.file, 'media');
      } catch (error) {
        return res.status(500).json({ error: 'Failed to upload media file' });
      }
    }

    if (!url) {
      return res.status(400).json({ error: 'Media URL or file is required' });
    }

    const mediaData = {
      ...req.body,
      libraryId,
      url,
      isApproved: false, // New media needs approval
      createdAt: new Date()
    };

    const mediaItem = await drizzleService.createMediaItem(mediaData);
    return res.status(201).json(mediaItem);
  }));

  // Update media item with image upload
  app.patch(`${global_path}/media-items/:id`, upload.single('mediaFile'), apiHandler(async (req, res) => {
    if (!req.session.user) {
      return res.status(403).json({ error: 'Unauthorized - not logged in' });
    }

    const mediaId = req.params.id;
    const existingMedia = await drizzleService.getMediaItem(mediaId);

    if (!existingMedia) {
      return res.status(404).json({ error: 'Media item not found' });
    }

    // Check ownership
    if (req.session.user.role === 'library_admin' && existingMedia.libraryId !== req.session.user.libraryId) {
      return res.status(403).json({ error: 'Unauthorized - you can only edit media for your library' });
    }

    // Handle media file upload
    let url = req.body.url || existingMedia.url;
    if (req.file) {
      try {
        url = await uploadImageToCloudinary(req.file, 'media');
      } catch (error) {
        return res.status(500).json({ error: 'Failed to upload media file' });
      }
    }

    const updateData = {
      ...req.body,
      url,
      updatedAt: new Date()
    };

    const updatedMedia = await drizzleService.updateMediaItem(mediaId, updateData);
    return res.status(200).json(updatedMedia);
  }));

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

  app.post(`${global_path}/events`, upload.single('eventImage'), apiHandler(async (req, res) => {
    if (!req.session.user) {
      return res.status(403).json({ error: 'Unauthorized - not logged in' });
    }

    const libraryId = req.session.user.libraryId;
    if (!libraryId) {
      return res.status(400).json({ error: 'Library ID required' });
    }

    // Handle event image upload
    let imageUrl = req.body.imageUrl || null;
    if (req.file) {
      try {
        imageUrl = await uploadImageToCloudinary(req.file, 'events');
      } catch (error) {
        return res.status(500).json({ error: 'Failed to upload event image' });
      }
    }

    const eventData = {
      ...req.body,
      libraryId,
      imageUrl,
      isApproved: false, // New events need approval
      createdAt: new Date()
    };

    const event = await drizzleService.createEvent(eventData);
    return res.status(201).json(event);
  }));

  // Update event with image upload
  app.patch(`${global_path}/events/:id`, upload.single('eventImage'), apiHandler(async (req, res) => {
    if (!req.session.user) {
      return res.status(403).json({ error: 'Unauthorized - not logged in' });
    }

    const eventId = req.params.id;
    const existingEvent = await drizzleService.getEvent(eventId);

    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check ownership
    if (req.session.user.role === 'library_admin' && existingEvent.libraryId !== req.session.user.libraryId) {
      return res.status(403).json({ error: 'Unauthorized - you can only edit events for your library' });
    }

    // Handle event image upload
    let imageUrl = req.body.imageUrl || existingEvent.imageUrl;
    if (req.file) {
      try {
        imageUrl = await uploadImageToCloudinary(req.file, 'events');
      } catch (error) {
        return res.status(500).json({ error: 'Failed to upload event image' });
      }
    }

    const updateData = {
      ...req.body,
      imageUrl,
      updatedAt: new Date()
    };

    const updatedEvent = await drizzleService.updateEvent(eventId, updateData);
    return res.status(200).json(updatedEvent);
  }));

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


  // Maintenance endpoints
  let maintenanceMode = false;
  const maintenanceWindows: any[] = [];
  const backupHistory: any[] = [
    { id: 1, type: 'full', size: '2.3 GB', created: new Date('2025-06-18T02:00:00Z'), status: 'completed' },
    { id: 2, type: 'database', size: '890 MB', created: new Date('2025-06-17T02:00:00Z'), status: 'completed' },
    { id: 3, type: 'files', size: '1.4 GB', created: new Date('2025-06-16T02:00:00Z'), status: 'completed' },
    { id: 4, type: 'database', size: '885 MB', created: new Date('2025-06-15T02:00:00Z'), status: 'completed' },
  ];

  // health check endpoint
  app.get(`${global_path}/health`, async (req, res) => {
    try {
      const isHealthy = await drizzleService.healthCheck();
      res.json({
        status: isHealthy ? 'system healthy' : 'system unhealthy',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: 'system unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Get maintenance status
  app.get(`${global_path}/maintenance/status`, async (req, res) => {
    try {
      const systemHealth = [
        { service: 'Web Server', status: 'healthy', uptime: '15 days, 3 hours', responseTime: 145, lastCheck: new Date() },
        { service: 'Database', status: 'healthy', uptime: '15 days, 3 hours', responseTime: 23, lastCheck: new Date() },
        { service: 'File Storage', status: 'warning', uptime: '2 days, 1 hour', responseTime: 287, lastCheck: new Date() },
        { service: 'Email Service', status: 'healthy', uptime: '15 days, 3 hours', responseTime: 412, lastCheck: new Date() },
        { service: 'CDN', status: 'healthy', uptime: '30 days, 12 hours', responseTime: 89, lastCheck: new Date() },
      ];

      const systemMetrics = {
        cpuUsage: Math.floor(Math.random() * 30) + 15,
        memoryUsage: Math.floor(Math.random() * 40) + 50,
        diskUsage: Math.floor(Math.random() * 30) + 30,
        networkTraffic: '1.2 GB/day'
      };

      return res.status(200).json({
        maintenanceMode,
        systemHealth,
        systemMetrics,
        maintenanceWindows,
        backupHistory
      });
    } catch (error) {
      console.error("Error fetching maintenance status:", error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Toggle maintenance mode
  app.post(`${global_path}/maintenance/toggle`, async (req, res) => {
    try {
      const { enabled } = req.body;
      maintenanceMode = enabled;

      return res.status(200).json({
        success: true,
        maintenanceMode,
        message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      console.error("Error toggling maintenance mode:", error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Schedule maintenance window
  app.post(`${global_path}/maintenance/schedule`, async (req, res) => {
    try {
      const { title, description, scheduledStart, scheduledEnd, affectedServices } = req.body;

      if (!title || !scheduledStart) {
        return res.status(400).json({ error: 'Title and start time are required' });
      }

      const newWindow = {
        id: Date.now(),
        title,
        description,
        scheduledStart: new Date(scheduledStart),
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
        affectedServices: affectedServices || [],
        status: 'scheduled',
        createdAt: new Date()
      };

      maintenanceWindows.push(newWindow);

      return res.status(201).json(newWindow);
    } catch (error) {
      console.error("Error scheduling maintenance:", error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create backup
  app.post(`${global_path}/maintenance/backup`, async (req, res) => {
    try {
      const { type } = req.body;

      if (!['database', 'files', 'full'].includes(type)) {
        return res.status(400).json({ error: 'Invalid backup type' });
      }

      // Simulate backup creation
      const sizes = {
        database: `${Math.floor(Math.random() * 500) + 800} MB`,
        files: `${Math.floor(Math.random() * 800) + 1200} MB`,
        full: `${Math.floor(Math.random() * 1000) + 2000} MB`
      };

      const newBackup = {
        id: Date.now(),
        type,
        size: sizes[type as keyof typeof sizes],
        created: new Date(),
        status: 'running'
      };

      backupHistory.unshift(newBackup);

      // Simulate backup completion after 3 seconds
      setTimeout(() => {
        const backup = backupHistory.find(b => b.id === newBackup.id);
        if (backup) {
          backup.status = 'completed';
        }
      }, 3000);

      return res.status(201).json(newBackup);
    } catch (error) {
      console.error("Error creating backup:", error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get backup history
  app.get(`${global_path}/maintenance/backups`, async (req, res) => {
    try {
      return res.status(200).json(backupHistory);
    } catch (error) {
      console.error("Error fetching backups:", error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Refresh system status
  app.post(`${global_path}/maintenance/refresh`, async (req, res) => {
    try {
      // Simulate system check with random variations
      const systemHealth = [
        {
          service: 'Web Server',
          status: 'healthy',
          uptime: '15 days, 3 hours',
          responseTime: Math.floor(Math.random() * 50) + 120,
          lastCheck: new Date()
        },
        {
          service: 'Database',
          status: 'healthy',
          uptime: '15 days, 3 hours',
          responseTime: Math.floor(Math.random() * 20) + 15,
          lastCheck: new Date()
        },
        {
          service: 'File Storage',
          status: Math.random() > 0.8 ? 'warning' : 'healthy',
          uptime: '2 days, 1 hour',
          responseTime: Math.floor(Math.random() * 100) + 200,
          lastCheck: new Date()
        },
        {
          service: 'Email Service',
          status: 'healthy',
          uptime: '15 days, 3 hours',
          responseTime: Math.floor(Math.random() * 200) + 350,
          lastCheck: new Date()
        },
        {
          service: 'CDN',
          status: 'healthy',
          uptime: '30 days, 12 hours',
          responseTime: Math.floor(Math.random() * 30) + 70,
          lastCheck: new Date()
        },
      ];

      return res.status(200).json({ systemHealth });
    } catch (error) {
      console.error("Error refreshing system status:", error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Events endpoints
  app.get(`${global_path}/events`, async (req, res) => {
    try {
      const libraryId = req.session.user?.libraryId;
      const options = libraryId ? { libraryId } : {};

      const events = await drizzleService.getEvents(options);
      return res.status(200).json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete(`${global_path}/events/:id`, async (req, res) => {
    try {
      const eventId = req.params.id;
      const deleted = await drizzleService.deleteEvent(eventId);

      if (!deleted) {
        return res.status(404).json({ error: 'Event not found' });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting event:", error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Contact messages endpoints
  app.get(`${global_path}/contact-messages`, async (req, res) => {
    try {
      const libraryId = req.session.user?.libraryId;
      const options = libraryId ? { libraryId } : {};

      const messages = await drizzleService.getContactMessages(options);
      return res.status(200).json(messages);
    } catch (error) {
      console.error("Error fetching contact messages:", error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post(`${global_path}/contact-messages`, contactLimiter, async (req, res) => {
    try {
      const message = await drizzleService.createContactMessage(req.body);
      return res.status(201).json(message);
    } catch (error) {
      console.error("Error creating contact message:", error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.patch(`${global_path}/contact-messages/:id`, async (req, res) => {
    try {
      const messageId = req.params.id;
      const updatedMessage = await drizzleService.updateContactMessage(messageId, req.body);

      if (!updatedMessage) {
        return res.status(404).json({ error: 'Contact message not found' });
      }

      return res.status(200).json(updatedMessage);
    } catch (error) {
      console.error("Error updating contact message:", error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Reply to a contact message
  app.post(`${global_path}/contact-messages/:id/reply`, emailLimiter, jsonApiMiddleware, apiHandler(async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'library_admin') {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const messageId = req.params.id;
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: "Subject and message are required" });
    }

    // Get the original message
    const originalMessage = await drizzleService.getContactMessage(messageId);
    if (!originalMessage || originalMessage.libraryId !== req.session.user.libraryId) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Get library information
    const library = await drizzleService.getLibrary(req.session.user.libraryId!);
    if (!library) {
      return res.status(404).json({ error: "Library not found" });
    }

    try {
      // Send email response to visitor
      const emailSent = await sendResponseEmail({
        visitorEmail: originalMessage.email,
        visitorName: originalMessage.name,
        originalSubject: originalMessage.subject,
        responseSubject: subject,
        responseMessage: message,
        libraryName: library.name,
        libraryEmail: "noreply@library.com"
      });

      if (!emailSent) {
        return res.status(500).json({ error: "Failed to send email response" });
      }

      // Create message response record
      const response = await drizzleService.createMessageResponse({
        contactMessageId: messageId,
        respondedBy: req.session.user.id,
        subject,
        message
      });

      // Update contact message status
      await drizzleService.updateContactMessage(messageId, {
        responseStatus: 'responded',
        isRead: true
      });

      res.json(response);
    } catch (error) {
      console.error('Error sending reply:', error);
      res.status(500).json({ error: "Failed to send reply" });
    }
  }));

  // Analytics endpoints
  app.get(`${global_path}/admin/dashboard/stats`, async (req, res) => {
    try {
      const libraryId = req.session.user?.libraryId;
      if (!libraryId) {
        return res.status(400).json({ error: 'Library ID required' });
      }

      const stories = await drizzleService.getStories({ libraryId });
      const mediaItems = await drizzleService.getMediaItems({ libraryId });
      const events = await drizzleService.getEvents({ libraryId });
      const messages = await drizzleService.getContactMessages({ libraryId });

      const stats = {
        totalStories: stories.length,
        publishedStories: stories.filter(s => s.isPublished).length,
        totalMedia: mediaItems.length,
        approvedMedia: mediaItems.filter(m => m.isApproved).length,
        totalEvents: events.length,
        upcomingEvents: events.filter(e => new Date(e.eventDate) > new Date()).length,
        totalMessages: messages.length,
        unreadMessages: messages.filter(m => !m.isRead).length
      };

      return res.status(200).json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get(`${global_path}/admin/dashboard/analytics`, async (req, res) => {
    try {
      const libraryId = req.session.user?.libraryId;
      if (!libraryId) {
        return res.status(400).json({ error: 'Library ID required' });
      }

      const analytics = await drizzleService.getAnalytics({ libraryId });

      // Process analytics data for charts
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const visitorData = last30Days.map(date => {
        const dayAnalytics = analytics.filter(a =>
          a.date && new Date(a.date).toISOString().split('T')[0] === date
        );
        const totalViews = dayAnalytics.reduce((sum, a) => sum + (a.views || 0), 0);

        return {
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          visitors: totalViews,
          uniqueVisitors: Math.floor(totalViews * 0.7) // Approximate unique visitors
        };
      });

      const contentData = [
        { name: 'Stories', views: analytics.filter(a => a.storyId).reduce((sum, a) => sum + (a.views || 0), 0), engagement: 75 },
        { name: 'Gallery', views: analytics.filter(a => a.pageType === 'gallery').reduce((sum, a) => sum + (a.views || 0), 0), engagement: 85 },
        { name: 'Library Profile', views: analytics.filter(a => a.pageType === 'library_profile').reduce((sum, a) => sum + (a.views || 0), 0), engagement: 65 }
      ];

      const engagementData = last30Days.slice(-7).map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        avgTimeSpent: Math.floor(Math.random() * 300) + 120, // Mock data for demo
        interactionRate: Math.floor(Math.random() * 40) + 60
      }));

      const topPerformers = {
        topStory: 'Featured Exhibition',
        topStoryViews: Math.max(...analytics.filter(a => a.storyId).map(a => a.views || 0), 0),
        topGallery: 'Main Collection',
        topGalleryViews: Math.max(...analytics.filter(a => a.pageType === 'gallery').map(a => a.views || 0), 0),
        avgTimeOnPage: '4:32',
        avgTimeIncrease: 12
      };

      return res.status(200).json({
        visitorData,
        contentData,
        engagementData,
        topPerformers
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get(`${global_path}/admin/dashboard/activity`, async (req, res) => {
    try {
      const libraryId = req.session.user?.libraryId;
      if (!libraryId) {
        return res.status(400).json({ error: 'Library ID required' });
      }

      const stories = await drizzleService.getStories({ libraryId, limit: 5 });
      const messages = await drizzleService.getContactMessages({ libraryId, limit: 5 });
      const events = await drizzleService.getEvents({ libraryId, limit: 5 });

      const recentActivity = [
        ...stories.map(s => ({
          type: 'story',
          title: `Story updated: ${s.title}`,
          timestamp: s.updatedAt || s.createdAt,
          status: s.isPublished ? 'published' : 'draft'
        })),
        ...messages.map(m => ({
          type: 'message',
          title: `New inquiry: ${m.subject}`,
          timestamp: m.createdAt,
          status: m.isRead ? 'read' : 'unread'
        })),
        ...events.map(e => ({
          type: 'event',
          title: `Event: ${e.title}`,
          timestamp: e.createdAt,
          status: e.isPublished ? 'published' : 'draft'
        }))
      ].sort((a, b) =>
        new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime()
      ).slice(0, 10);

      return res.status(200).json(recentActivity);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });


  // Settings endpoints
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

  // Get all story tags
  app.get(`${global_path}/stories/tags`, async (req, res) => {
    try {
      const stories = await drizzleService.getStories({ published: true, approved: true });
      const allTags = new Set<string>();

      stories.forEach(story => {
        if (story.tags && Array.isArray(story.tags)) {
          story.tags.forEach(tag => allTags.add(tag));
        }
      });

      const sortedTags = Array.from(allTags).sort();
      return res.status(200).json(sortedTags);
    } catch (error) {
      console.error("Error fetching story tags:", error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Delete Image Route
  app.delete(global_path + '/admin/upload/image/:publicId', apiHandler(async (req: Request, res: Response) => {
    const { publicId } = req.params;

    if (!cloudinaryService.isReady()) {
      return res.status(503).json({ error: 'Cloudinary not configured' });
    }

    try {
      // Decode the public ID (it may be URL encoded)
      const decodedPublicId = decodeURIComponent(publicId);
      const success = await cloudinaryService.deleteImage(decodedPublicId);

      if (success) {
        return res.status(200).json({ success: true, message: 'Image deleted successfully' });
      } else {
        return res.status(404).json({ error: 'Image not found or already deleted' });
      }
    } catch (error) {
      console.error("Image deletion error:", error);
      return res.status(500).json({
        error: 'Failed to delete image',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }));

  // Admin: Get all galleries
  app.get(`${global_path}/admin/galleries`, apiHandler(async (req, res) => {
    if (!req.session.user) {
      return res.status(403).json({ error: 'Unauthorized - not logged in' });
    }
    const galleries = await drizzleService.getGalleries();
    return res.status(200).json(galleries);
  }));

  // Admin: Get all unique media tags
  app.get(`${global_path}/admin/media/tags`, apiHandler(async (req, res) => {
    if (!req.session.user) {
      return res.status(403).json({ error: 'Unauthorized - not logged in' });
    }
    const mediaItems = await drizzleService.getMediaItems();
    const allTags = new Set<string>();
    mediaItems.forEach(item => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => allTags.add(tag));
      }
    });
    const sortedTags = Array.from(allTags).sort();
    return res.status(200).json(sortedTags);
  }));

  const httpServer = createServer(app);

  return httpServer;
}
