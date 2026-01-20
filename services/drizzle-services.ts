
import {
    User,
    InsertUser,
    Library,
    InsertLibrary,
    Story,
    InsertStory,
    MediaItem,
    InsertMediaItem,
    Timeline,
    InsertTimeline,
    Event,
    InsertEvent,
    ContactMessage,
    InsertContactMessage,
    Analytics,
    InsertAnalytics,
    MessageResponse,
    InsertMessageResponse,
    EmailTemplate,
    InsertEmailTemplate,

    users, libraries, stories, mediaItems, timelines,
    events, contactMessages, analytics, messageResponses, emailTemplates,
} from "../config/database/schema";

import dbPool from "../config/database/db";
import { eq, desc, and, gte, lte, isNull } from "drizzle-orm";
import { IStorage } from "../config/database/storage";

const { db } = dbPool;


export class DatabaseStorage implements IStorage {
    // Users
    async getUser(id: string): Promise<User | undefined> {
        try {
            const [user] = await db.select().from(users).where(eq(users.id, id));
            return user || undefined;
        } catch (error) {
            console.error('Error in getUser:', error);
            return undefined;
        }
    }

    async getUserByUsername(username: string): Promise<User | undefined> {
        try {
            const [user] = await db.select().from(users).where(eq(users.username, username));
            return user || undefined;
        } catch (error) {
            console.error('Error in getUserByUsername:', error);
            return undefined;
        }
    }

    async getUsersByLibraryId(libraryId: string): Promise<User[]> {
        try {
            return db.select().from(users).where(eq(users.libraryId, libraryId));
        } catch (error) {
            console.error('Error in getUsersByLibraryId:', error);
            return [];
        }
    }

    async createUser(insertUser: InsertUser): Promise<User> {
        try {
            // Check if user with this email already exists
            const existingUser = await db.select()
                .from(users)
                .where(eq(users.email, insertUser.email))
                .limit(1);

            if (existingUser.length > 0) {
                throw new Error("A user with this email already exists.");
            }

            // If email is unique, proceed with insertion
            const [user] = await db.insert(users).values(insertUser).returning();
            return user;
        } catch (error) {
            console.error('Error in createUser:', error);
            throw error;
        }
    }

    async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
        try {
            const [updatedUser] = await db.update(users).set(data).where(eq(users.id, id)).returning();
            return updatedUser || undefined;
        } catch (error) {
            console.error('Error in updateUser:', error);
            return undefined;
        }
    }

    // Libraries
    async getLibrary(id: string): Promise<Library | undefined> {
        try {
            const [library] = await db.select().from(libraries).where(eq(libraries.id, id));
            return library || undefined;
        } catch (error) {
            console.error('Error in getLibrary:', error);
            return undefined;
        }
    }

    async getLibraryByName(name: string): Promise<Library | undefined> {
        try {
            const [library] = await db.select().from(libraries).where(eq(libraries.name, name));
            return library || undefined;
        } catch (error) {
            console.error('Error in getLibraryByName:', error);
            return undefined;
        }
    }

    async getLibraries(options?: {
        approved?: boolean;
        featured?: boolean;
        type?: string;
        active?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<Library[]> {
        try {
            let query = db.select().from(libraries);

            if (options) {
                const conditions: any[] = [];

                if (options.approved !== undefined) {
                    conditions.push(eq(libraries.isApproved, options.approved));
                }

                if (options.featured !== undefined) {
                    conditions.push(eq(libraries.isFeatured, options.featured));
                }

                if (options.type) {
                    conditions.push(eq(libraries.libraryType, options.type));
                }

                if (options.active !== undefined) {
                    conditions.push(eq(libraries.isActive, options.active));
                }

                if (conditions.length > 0) {
                    query = (query as any).where(and(...conditions));
                }

                if (options.limit) {
                    query = (query as any).limit(options.limit);
                }

                if (options.offset) {
                    query = (query as any).offset(options.offset);
                }
            }

            return query;
        } catch (error) {
            console.error('Error in getLibraries:', error);
            return [];
        }
    }

    async getTotalLibraries(options?: {
        approved?: boolean;
        featured?: boolean;
        type?: string;
    }): Promise<number> {
        try {
            const conditions: any[] = [];

            if (options) {
                if (options.approved !== undefined) {
                    conditions.push(eq(libraries.isApproved, options.approved));
                }

                if (options.featured !== undefined) {
                    conditions.push(eq(libraries.isFeatured, options.featured));
                }

                if (options.type) {
                    conditions.push(eq(libraries.libraryType, options.type));
                }
            }

            const query = conditions.length > 0
                ? db.select().from(libraries).where(and(...conditions))
                : db.select().from(libraries);

            const result = await query;
            return result.length;
        } catch (error) {
            console.error('Error in getTotalLibraries:', error);
            return 0;
        }
    }

    async createLibrary(insertLibrary: InsertLibrary): Promise<Library> {
        try {
            const [library] = await db.insert(libraries).values(insertLibrary).returning();
            return library;
        } catch (error) {
            console.error('Error in createLibrary:', error);
            throw error;
        }
    }

    async updateLibrary(id: string, data: Partial<Library>): Promise<Library | undefined> {
        try {
            const [updatedLibrary] = await db.update(libraries).set(data).where(eq(libraries.id, id)).returning();
            return updatedLibrary || undefined;
        } catch (error) {
            console.error('Error in updateLibrary:', error);
            return undefined;
        }
    }

    // Stories
    async getStory(id: string): Promise<Story | undefined> {
        try {
            const [story] = await db.select().from(stories).where(eq(stories.id, id));
            return story || undefined;
        } catch (error) {
            console.error('Error in getStory:', error);
            return undefined;
        }
    }

    async getStories(options?: {
        libraryId?: string;
        published?: boolean;
        approved?: boolean;
        featured?: boolean;
        tags?: string[];
        limit?: number;
        offset?: number;
    }): Promise<Story[]> {
        try {
            let query = db.select().from(stories);

            if (options) {
                const conditions: any[] = [];

                if (options.libraryId !== undefined) {
                    conditions.push(eq(stories.libraryId, options.libraryId));
                }

                if (options.published !== undefined) {
                    conditions.push(eq(stories.isPublished, options.published));
                }

                if (options.approved !== undefined) {
                    conditions.push(eq(stories.isApproved, options.approved));
                }

                if (options.featured !== undefined) {
                    conditions.push(eq(stories.isFeatured, options.featured));
                }

                if (conditions.length > 0) {
                    query = (query as any).where(and(...conditions));
                }

                // Tags filtering would need a different approach with SQL arrays
                // This is a simplified approach for this example

                query = (query as any).orderBy(desc(stories.createdAt));

                if (options.limit) {
                    query = (query as any).limit(options.limit);
                }

                if (options.offset) {
                    query = (query as any).offset(options.offset);
                }
            }

            return query;
        } catch (error) {
            console.error('Error in getStories:', error);
            return [];
        }
    }

    async createStory(insertStory: InsertStory): Promise<Story> {
        try {
            const [story] = await db.insert(stories).values(insertStory).returning();
            return story;
        } catch (error) {
            console.error('Error in createStory:', error);
            throw error;
        }
    }

    async updateStory(id: string, data: Partial<Story>): Promise<Story | undefined> {
        try {
            const [updatedStory] = await db.update(stories).set(data).where(eq(stories.id, id)).returning();
            return updatedStory || undefined;
        } catch (error) {
            console.error('Error in updateStory:', error);
            return undefined;
        }
    }

    async deleteStory(id: string): Promise<boolean> {
        try {
            const result = await db.delete(stories).where(eq(stories.id, id)).returning();
            return result.length > 0;
        } catch (error) {
            console.error('Error in deleteStory:', error);
            return false;
        }
    }

    // Media Items
    async getMediaItem(id: string): Promise<MediaItem | undefined> {
        try {
            const [mediaItem] = await db.select().from(mediaItems).where(eq(mediaItems.id, id));
            return mediaItem || undefined;
        } catch (error) {
            console.error('Error in getMediaItem:', error);
            return undefined;
        }
    }

    async getMediaItems(options?: {
        libraryId?: string;
        galleryId?: string;
        approved?: boolean;
        mediaType?: string;
        tags?: string[];
        limit?: number;
        offset?: number;
    }): Promise<MediaItem[]> {
        try {
            let query = db.select().from(mediaItems);

            if (options) {
                const conditions: any[] = [];

                if (options.libraryId !== undefined) {
                    conditions.push(eq(mediaItems.libraryId, options.libraryId));
                }

                if (options.galleryId !== undefined) {
                    conditions.push(eq(mediaItems.galleryId, options.galleryId));
                }

                if (options.approved !== undefined) {
                    conditions.push(eq(mediaItems.isApproved, options.approved));
                }

                if (options.mediaType) {
                    conditions.push(eq(mediaItems.mediaType, options.mediaType));
                }

                if (conditions.length > 0) {
                    query = (query as any).where(and(...conditions));
                }

                // Tags filtering would need a different approach with SQL arrays

                query = (query as any).orderBy(desc(mediaItems.createdAt));

                if (options.limit) {
                    query = (query as any).limit(options.limit);
                }

                if (options.offset) {
                    query = (query as any).offset(options.offset);
                }
            }

            return query;
        } catch (error) {
            console.error('Error in getMediaItems:', error);
            return [];
        }
    }

    async createMediaItem(insertMediaItem: InsertMediaItem): Promise<MediaItem> {
        try {
            const [mediaItem] = await db.insert(mediaItems).values(insertMediaItem).returning();
            return mediaItem;
        } catch (error) {
            console.error('Error in createMediaItem:', error);
            throw error;
        }
    }

    async updateMediaItem(id: string, data: Partial<MediaItem>): Promise<MediaItem | undefined> {
        try {
            const [updatedMediaItem] = await db.update(mediaItems).set(data).where(eq(mediaItems.id, id)).returning();
            return updatedMediaItem || undefined;
        } catch (error) {
            console.error('Error in updateMediaItem:', error);
            return undefined;
        }
    }

    async deleteMediaItem(id: string): Promise<boolean> {
        try {
            const result = await db.delete(mediaItems).where(eq(mediaItems.id, id)).returning();
            return result.length > 0;
        } catch (error) {
            console.error('Error in deleteMediaItem:', error);
            return false;
        }
    }

    // Timelines
    async getTimeline(id: string): Promise<Timeline | undefined> {
        try {
            const [timeline] = await db.select().from(timelines).where(eq(timelines.id, id));
            return timeline || undefined;
        } catch (error) {
            console.error('Error in getTimeline:', error);
            return undefined;
        }
    }

    async getTimelinesByStoryId(storyId: string): Promise<Timeline[]> {
        try {
            return db.select().from(timelines).where(eq(timelines.storyId, storyId));
        } catch (error) {
            console.error('Error in getTimelinesByStoryId:', error);
            return [];
        }
    }

    async createTimeline(insertTimeline: InsertTimeline): Promise<Timeline> {
        try {
            const [timeline] = await db.insert(timelines).values(insertTimeline).returning();
            return timeline;
        } catch (error) {
            console.error('Error in createTimeline:', error);
            throw error;
        }
    }

    async updateTimeline(id: string, data: Partial<Timeline>): Promise<Timeline | undefined> {
        try {
            const [updatedTimeline] = await db.update(timelines).set(data).where(eq(timelines.id, id)).returning();
            return updatedTimeline || undefined;
        } catch (error) {
            console.error('Error in updateTimeline:', error);
            return undefined;
        }
    }

    async deleteTimeline(id: string): Promise<boolean> {
        try {
            const result = await db.delete(timelines).where(eq(timelines.id, id)).returning();
            return result.length > 0;
        } catch (error) {
            console.error('Error in deleteTimeline:', error);
            return false;
        }
    }

    // Events
    async getEvent(id: string): Promise<Event | undefined> {
        try {
            const [event] = await db.select().from(events).where(eq(events.id, id));
            return event || undefined;
        } catch (error) {
            console.error('Error in getEvent:', error);
            return undefined;
        }
    }

    async getEvents(options?: {
        libraryId?: string;
        published?: boolean;
        approved?: boolean;
        upcoming?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<Event[]> {
        try {
            let query = db.select().from(events);

            if (options) {
                const conditions: any[] = [];

                if (options.libraryId !== undefined) {
                    conditions.push(eq(events.libraryId, options.libraryId));
                }

                if (options.published !== undefined) {
                    conditions.push(eq(events.isPublished, options.published));
                }

                if (options.approved !== undefined) {
                    conditions.push(eq(events.isApproved, options.approved));
                }

                if (options.upcoming) {
                    const now = new Date();
                    conditions.push(gte(events.eventDate, now));
                }

                if (conditions.length > 0) {
                    query = (query as any).where(and(...conditions));
                }

                query = (query as any).orderBy(events.eventDate);

                if (options.limit) {
                    query = (query as any).limit(options.limit);
                }

                if (options.offset) {
                    query = (query as any).offset(options.offset);
                }
            }

            return query;
        } catch (error) {
            console.error('Error in getEvents:', error);
            return [];
        }
    }

    async createEvent(insertEvent: InsertEvent): Promise<Event> {
        try {
            const [event] = await db.insert(events).values(insertEvent).returning();
            return event;
        } catch (error) {
            console.error('Error in createEvent:', error);
            throw error;
        }
    }

    async updateEvent(id: string, data: Partial<Event>): Promise<Event | undefined> {
        try {
            const [updatedEvent] = await db.update(events).set(data).where(eq(events.id, id)).returning();
            return updatedEvent || undefined;
        } catch (error) {
            console.error('Error in updateEvent:', error);
            return undefined;
        }
    }

    async deleteEvent(id: string): Promise<boolean> {
        try {
            const result = await db.delete(events).where(eq(events.id, id)).returning();
            return result.length > 0;
        } catch (error) {
            console.error('Error in deleteEvent:', error);
            return false;
        }
    }

    // Contact Messages
    async getContactMessage(id: string): Promise<ContactMessage | undefined> {
        try {
            const [message] = await db.select().from(contactMessages).where(eq(contactMessages.id, id));
            return message || undefined;
        } catch (error) {
            console.error('Error in getContactMessage:', error);
            return undefined;
        }
    }

    async getContactMessages(options?: {
        libraryId?: string;
        read?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<ContactMessage[]> {
        try {
            let query = db.select().from(contactMessages);

            if (options) {
                const conditions: any[] = [];

                if (options.libraryId !== undefined) {
                    conditions.push(eq(contactMessages.libraryId, options.libraryId));
                }

                if (options.read !== undefined) {
                    conditions.push(eq(contactMessages.isRead, options.read));
                }

                if (conditions.length > 0) {
                    query = (query as any).where(and(...conditions));
                }

                query = (query as any).orderBy(desc(contactMessages.createdAt));

                if (options.limit) {
                    query = (query as any).limit(options.limit);
                }

                if (options.offset) {
                    query = (query as any).offset(options.offset);
                }
            }

            return query;
        } catch (error) {
            console.error('Error in getContactMessages:', error);
            return [];
        }
    }

    async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
        try {
            const [message] = await db.insert(contactMessages).values(insertMessage).returning();
            return message;
        } catch (error) {
            console.error('Error in createContactMessage:', error);
            throw error;
        }
    }

    async updateContactMessage(id: string, data: Partial<ContactMessage>): Promise<ContactMessage | undefined> {
        try {
            const [updatedMessage] = await db.update(contactMessages).set(data).where(eq(contactMessages.id, id)).returning();
            return updatedMessage || undefined;
        } catch (error) {
            console.error('Error in updateContactMessage:', error);
            return undefined;
        }
    }

    async deleteContactMessage(id: string): Promise<boolean> {
        try {
            const result = await db.delete(contactMessages).where(eq(contactMessages.id, id)).returning();
            return result.length > 0;
        } catch (error) {
            console.error('Error in deleteContactMessage:', error);
            return false;
        }
    }

    // Analytics
    async getAnalytics(options: {
        libraryId?: string;
        storyId?: string;
        pageType?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<Analytics[]> {
        try {
            let query = db.select().from(analytics);

            const conditions: any[] = [];

            if (options.libraryId !== undefined) {
                conditions.push(eq(analytics.libraryId, options.libraryId));
            }

            if (options.storyId !== undefined) {
                conditions.push(eq(analytics.storyId, options.storyId));
            }

            if (options.pageType) {
                conditions.push(eq(analytics.pageType, options.pageType));
            }

            if (options.startDate) {
                conditions.push(gte(analytics.date, options.startDate.toISOString()));
            }

            if (options.endDate) {
                conditions.push(lte(analytics.date, options.endDate.toISOString()));
            }

            if (conditions.length > 0) {
                query = (query as any).where(and(...conditions));
            }

            return query;
        } catch (error) {
            console.error('Error in getAnalytics:', error);
            return [];
        }
    }

    async incrementAnalytics(data: InsertAnalytics): Promise<Analytics> {
        try {
            const { libraryId, storyId, pageType } = data;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Try to find existing analytics record for today
            const [existing] = await db.select().from(analytics).where(
                and(
                    eq(analytics.libraryId, libraryId),
                    storyId ? eq(analytics.storyId, storyId) : isNull(analytics.storyId),
                    eq(analytics.pageType, pageType),
                    eq(analytics.date, today.toISOString())
                )
            );

            if (existing) {
                // Update existing record
                const [updated] = await db.update(analytics)
                    .set({ views: (existing.views || 0) + 1 })
                    .where(eq(analytics.id, existing.id))
                    .returning();
                return updated;
            } else {
                // Create new record
                const [newRecord] = await db.insert(analytics)
                    .values({
                        ...data,
                        date: today.toISOString(),
                        views: 1
                    })
                    .returning();
                return newRecord;
            }
        } catch (error) {
            console.error('Error in incrementAnalytics:', error);
            throw error;
        }
    }

    // Message Responses
    async getMessageResponse(id: string): Promise<MessageResponse | undefined> {
        try {
            const [response] = await db.select().from(messageResponses).where(eq(messageResponses.id, id));
            return response || undefined;
        } catch (error) {
            console.error('Error in getMessageResponse:', error);
            return undefined;
        }
    }

    async getMessageResponsesByContactMessageId(contactMessageId: string): Promise<MessageResponse[]> {
        try {
            return db.select().from(messageResponses)
                .where(eq(messageResponses.contactMessageId, contactMessageId))
                .orderBy(desc(messageResponses.createdAt));
        } catch (error) {
            console.error('Error in getMessageResponsesByContactMessageId:', error);
            return [];
        }
    }

    async createMessageResponse(insertResponse: InsertMessageResponse): Promise<MessageResponse> {
        try {
            const [response] = await db.insert(messageResponses).values(insertResponse).returning();
            return response;
        } catch (error) {
            console.error('Error in createMessageResponse:', error);
            throw error;
        }
    }

    async updateMessageResponse(id: string, data: Partial<MessageResponse>): Promise<MessageResponse | undefined> {
        try {
            const [updatedResponse] = await db.update(messageResponses).set(data).where(eq(messageResponses.id, id)).returning();
            return updatedResponse || undefined;
        } catch (error) {
            console.error('Error in updateMessageResponse:', error);
            return undefined;
        }
    }

    // Email Templates
    async getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
        try {
            const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
            return template || undefined;
        } catch (error) {
            console.error('Error in getEmailTemplate:', error);
            return undefined;
        }
    }

    async getEmailTemplates(options?: { libraryId?: string; isDefault?: boolean }): Promise<EmailTemplate[]> {
        try {
            let query = db.select().from(emailTemplates);

            if (options) {
                const conditions: any[] = [];

                if (options.libraryId !== undefined) {
                    conditions.push(eq(emailTemplates.libraryId, options.libraryId));
                }

                if (options.isDefault !== undefined) {
                    conditions.push(eq(emailTemplates.isDefault, options.isDefault));
                }

                if (conditions.length > 0) {
                    query = (query as any).where(and(...conditions));
                }
            }

            return query.orderBy(desc(emailTemplates.createdAt));
        } catch (error) {
            console.error('Error in getEmailTemplates:', error);
            return [];
        }
    }

    async createEmailTemplate(insertTemplate: InsertEmailTemplate): Promise<EmailTemplate> {
        try {
            const [template] = await db.insert(emailTemplates).values(insertTemplate).returning();
            return template;
        } catch (error) {
            console.error('Error in createEmailTemplate:', error);
            throw error;
        }
    }

    async updateEmailTemplate(id: string, data: Partial<EmailTemplate>): Promise<EmailTemplate | undefined> {
        try {
            const [updatedTemplate] = await db.update(emailTemplates).set(data).where(eq(emailTemplates.id, id)).returning();
            return updatedTemplate || undefined;
        } catch (error) {
            console.error('Error in updateEmailTemplate:', error);
            return undefined;
        }
    }

    async deleteEmailTemplate(id: string): Promise<boolean> {
        try {
            const result = await db.delete(emailTemplates).where(eq(emailTemplates.id, id)).returning();
            return result.length > 0;
        } catch (error) {
            console.error('Error in deleteEmailTemplate:', error);
            return false;
        }
    }

    // Galleries (unique galleryId values from mediaItems)
    async getGalleries(): Promise<string[]> {
        try {
            const rows = await db.select({ galleryId: mediaItems.galleryId }).from(mediaItems);
            const unique = new Set<string>();
            for (const row of rows) {
                if (row.galleryId && row.galleryId.trim() !== "") {
                    unique.add(row.galleryId);
                }
            }
            return Array.from(unique).sort();
        } catch (error) {
            console.error('Error in getGalleries:', error);
            return [];
        }
    }

    // Health check method
    async healthCheck(): Promise<boolean> {
        try {
            // Perform a simple select to check DB connectivity
            await db.select().from(users).limit(1);
            return true;
        } catch (error) {
            console.error('Database health check failed:', error);
            return false;
        }
    }

}

const storage = new DatabaseStorage();

export default storage;
