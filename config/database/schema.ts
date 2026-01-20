import { pgTable, text, integer, boolean, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (for both library admins and super admins)
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("library_admin"), // library_admin, super_admin
  libraryId: uuid("library_id"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow().notNull(),
});

// Libraries table
export const libraries = pgTable("libraries", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  logoUrl: text("logo_url"),
  featuredImageUrl: text("featured_image_url"),
  website: text("website"),
  isApproved: boolean("is_approved").default(false),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  libraryType: text("library_type").notNull(), // public, academic, special, etc.
  coordinates: jsonb("coordinates"), // { lat: number, lng: number }
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow().notNull(),
});

// Stories table
export const stories = pgTable("stories", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  libraryId: uuid("library_id").notNull().references(() => libraries.id, { onDelete: "cascade", onUpdate: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(), // Rich text content (HTML)
  summary: text("summary").notNull(),
  featuredImageUrl: text("featured_image_url"),
  isPublished: boolean("is_published").default(false),
  isApproved: boolean("is_approved").default(false),
  isFeatured: boolean("is_featured").default(false),
  publishedAt: timestamp("published_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  tags: text("tags").array(), // Array of tag strings
});

// Gallery (Media items) table
export const mediaItems = pgTable("media_items", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  libraryId: uuid("library_id").notNull().references(() => libraries.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  mediaType: text("media_type").notNull(), // image, video, audio, etc.
  url: text("url").notNull(),
  isApproved: boolean("is_approved").default(false),
  galleryId: text("gallery_id"), // Galleries are just groups of media items
  tags: text("tags").array(), // Array of tag strings
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow().notNull(),
});

// Timelines table
export const timelines = pgTable("timelines", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  storyId: uuid("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  timelinePoints: jsonb("timeline_points").notNull(), // Array of timeline point objects
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow().notNull(),
});

// Events table
export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  libraryId: uuid("library_id").notNull().references(() => libraries.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  eventDate: timestamp("event_date").notNull(),
  endDate: timestamp("end_date"),
  isPublished: boolean("is_published").default(false),
  isApproved: boolean("is_approved").default(false),
  location: text("location").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow().notNull(),
});

// Contact messages table
export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  libraryId: uuid("library_id").notNull().references(() => libraries.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  responseStatus: text("response_status").default("pending"), // pending, replied, closed
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow().notNull(),
});

// Analytics table (simplified for in-memory storage)
export const analytics = pgTable("analytics", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  libraryId: uuid("library_id").notNull().references(() => libraries.id, { onDelete: "cascade" }),
  storyId: uuid("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  pageType: text("page_type").notNull(), // library_profile, story, gallery, etc.
  views: integer("views").default(0),
  date: timestamp("date", {
    withTimezone: true,
    mode: "string",
  }).defaultNow().defaultNow(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow().notNull()
});

// Message responses table
export const messageResponses = pgTable("message_responses", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  contactMessageId: uuid("contact_message_id").notNull().references(() => contactMessages.id, { onDelete: "cascade" }),
  respondedBy: uuid("responded_by").notNull(), // User ID who responded
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  emailSent: boolean("email_sent").default(false),
  emailSentAt: timestamp("email_sent_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow().notNull(),
  templateUsed: text("template_used"), // Template ID if used
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow().notNull()
});

// Email templates table
export const emailTemplates = pgTable("email_templates", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  libraryId: uuid("library_id").notNull(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow().notNull(),
});

// Schema validations and types
export const insertUserSchema = createInsertSchema(users).omit({ id: true, lastLoginAt: true });
export const insertLibrarySchema = createInsertSchema(libraries).omit({ id: true, createdAt: true });
export const insertStorySchema = createInsertSchema(stories).omit({
  id: true, createdAt: true, updatedAt: true, publishedAt: true
});
export const insertMessageResponseSchema = createInsertSchema(messageResponses).omit({ id: true, createdAt: true, emailSent: true, emailSentAt: true });
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMediaItemSchema = createInsertSchema(mediaItems).omit({ id: true, createdAt: true });
export const insertTimelineSchema = createInsertSchema(timelines).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({ id: true, createdAt: true, isRead: true });
export const insertAnalyticsSchema = createInsertSchema(analytics).omit({ id: true, date: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Library = typeof libraries.$inferSelect;
export type InsertLibrary = z.infer<typeof insertLibrarySchema>;

export type Story = typeof stories.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;

export type MediaItem = typeof mediaItems.$inferSelect;
export type InsertMediaItem = z.infer<typeof insertMediaItemSchema>;

export type Timeline = typeof timelines.$inferSelect;
export type InsertTimeline = z.infer<typeof insertTimelineSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;

export type MessageResponse = typeof messageResponses.$inferSelect;
export type InsertMessageResponse = z.infer<typeof insertMessageResponseSchema>;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

// Authentication schemas
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;
