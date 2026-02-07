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
} from "./schema";

import dbPool from "./db";
import { v4 as uuidv4, NIL as NIL_UUID } from 'uuid';
import { hashSync } from "bcrypt";

const { db } = dbPool;


export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByLibraryId(libraryId: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  // Libraries
  getLibrary(id: string): Promise<Library | undefined>;
  getLibraryByName(name: string): Promise<Library | undefined>;
  getLibraries(options?: {
    approved?: boolean;
    featured?: boolean;
    type?: string;
    active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Library[]>;
  getTotalLibraries(options?: { approved?: boolean; featured?: boolean; type?: string }): Promise<number>;
  createLibrary(library: InsertLibrary): Promise<Library>;
  updateLibrary(id: string, data: Partial<Library>): Promise<Library | undefined>;

  // Stories
  getStory(id: string): Promise<Story | undefined>;
  getStories(options?: {
    libraryId?: string;
    published?: boolean;
    approved?: boolean;
    featured?: boolean;
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<Story[]>;
  createStory(story: InsertStory): Promise<Story>;
  updateStory(id: string, data: Partial<Story>): Promise<Story | undefined>;
  deleteStory(id: string): Promise<boolean>;

  // Media Items
  getMediaItem(id: string): Promise<MediaItem | undefined>;
  getMediaItems(options?: {
    libraryId?: string;
    galleryId?: string;
    approved?: boolean;
    mediaType?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<MediaItem[]>;
  createMediaItem(mediaItem: InsertMediaItem): Promise<MediaItem>;
  updateMediaItem(id: string, data: Partial<MediaItem>): Promise<MediaItem | undefined>;
  deleteMediaItem(id: string): Promise<boolean>;

  // Timelines
  getTimeline(id: string): Promise<Timeline | undefined>;
  getTimelinesByStoryId(storyId: string): Promise<Timeline[]>;
  createTimeline(timeline: InsertTimeline): Promise<Timeline>;
  updateTimeline(id: string, data: Partial<Timeline>): Promise<Timeline | undefined>;
  deleteTimeline(id: string): Promise<boolean>;

  // Events
  getEvent(id: string): Promise<Event | undefined>;
  getEvents(options?: {
    libraryId?: string;
    published?: boolean;
    approved?: boolean;
    upcoming?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, data: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;

  // Contact Messages
  getContactMessage(id: string): Promise<ContactMessage | undefined>;
  getContactMessages(options?: {
    libraryId?: string;
    read?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ContactMessage[]>;
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  updateContactMessage(id: string, data: Partial<ContactMessage>): Promise<ContactMessage | undefined>;
  deleteContactMessage(id: string): Promise<boolean>;

  // Analytics
  getAnalytics(options: {
    libraryId?: string;
    storyId?: string;
    pageType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Analytics[]>;
  incrementAnalytics(data: InsertAnalytics): Promise<Analytics>;


  // Message Responses
  getMessageResponse(id: string): Promise<MessageResponse | undefined>;
  getMessageResponsesByContactMessageId(contactMessageId: string): Promise<MessageResponse[]>;
  createMessageResponse(response: InsertMessageResponse): Promise<MessageResponse>;
  updateMessageResponse(id: string, data: Partial<MessageResponse>): Promise<MessageResponse | undefined>;

  // Email Templates
  getEmailTemplate(id: string): Promise<EmailTemplate | undefined>;
  getEmailTemplates(options?: {
    libraryId?: string;
    isDefault?: boolean;
  }): Promise<EmailTemplate[]>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: string, data: Partial<EmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: string): Promise<boolean>;

}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private librarys: Map<string, Library>;
  private stories: Map<string, Story>;
  private mediaItems: Map<string, MediaItem>;
  private timelines: Map<string, Timeline>;
  private events: Map<string, Event>;
  private contactMessages: Map<string, ContactMessage>;
  private analytics: Map<string, Analytics>;
  private messageResponses: Map<string, MessageResponse>;
  private emailTemplates: Map<string, EmailTemplate>;

  private userIdCounter: string;
  private libraryIdCounter: string;
  private storyIdCounter: string;
  private mediaItemIdCounter: string;
  private timelineIdCounter: string;
  private eventIdCounter: string;
  private contactMessageIdCounter: string;
  private analyticsIdCounter: string;
  private messageResponseIdCounter: string;
  private emailTemplateIdCounter: string;

  constructor() {
    this.users = new Map();
    this.librarys = new Map();
    this.stories = new Map();
    this.mediaItems = new Map();
    this.timelines = new Map();
    this.events = new Map();
    this.contactMessages = new Map();
    this.analytics = new Map();
    this.messageResponses = new Map();
    this.emailTemplates = new Map();

    this.userIdCounter = NIL_UUID;
    this.libraryIdCounter = NIL_UUID;
    this.storyIdCounter = NIL_UUID;
    this.mediaItemIdCounter = NIL_UUID;
    this.timelineIdCounter = NIL_UUID;
    this.eventIdCounter = NIL_UUID;
    this.contactMessageIdCounter = NIL_UUID;
    this.analyticsIdCounter = NIL_UUID;
    this.messageResponseIdCounter = NIL_UUID;
    this.emailTemplateIdCounter = NIL_UUID;

    // Initialize with sample data
    void this.initSampleData();
  }

  public async initSampleData() {

    // console.log("\n\nInitializing sample data...");
    // console.log("\n\nClearing existing data...")

    // // Drop tables in the reverse order of their dependencies
    // await db.delete(analytics);
    // await db.delete(contactMessages);
    // await db.delete(events);
    // await db.delete(timelines);
    // await db.delete(mediaItems);
    // await db.delete(stories);
    // await db.delete(users);
    // await db.delete(librarys);
    // await db.delete(emailTemplates);
    // await db.delete(messageResponses);

    // console.log("\n\nRebuilding tables...")

    // Create super admin user
    this.createUser({
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      email: "admin@libraryconnect.com",
      fullName: "System Administrator",
      role: "super_admin",
      isActive: true,
    });

    // Create sample librarys
    // Await the creation of librarys to get their IDs
    // Since initSampleData is not async, use .then() or make it async and await
    // Here, let's make initSampleData async and await the calls

    // (You will also need to update the function signature to `async initSampleData()` and call it with `void this.initSampleData();` in the constructor.)

    const library1 = await this.createLibrary({
      name: "Metropolitan Library of Modern Art",
      description: "Contemporary masterpieces spanning the 20th and 21st centuries.",
      location: "1000 Fifth Avenue",
      city: "New York",
      country: "USA",
      logoUrl: "https://images.unsplash.com/photo-1526285759904-71d5137eb68f?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80",
      featuredImageUrl: "https://images.unsplash.com/photo-1544939514-32fbc7a3c141?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
      website: "https://www.metlibrary.org",
      isApproved: true,
      isActive: true,
      isFeatured: true,
      libraryType: "art",
      coordinates: { lat: 40.7794, lng: -73.9632 },
    });

    const library2 = await this.createLibrary({
      name: "National Gallery of History",
      description: "Explore artifacts spanning over 3,000 years of human civilization.",
      location: "Trafalgar Square",
      city: "London",
      country: "UK",
      logoUrl: "https://images.unsplash.com/photo-1576019820619-896eeb6a6a8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80",
      featuredImageUrl: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
      website: "https://www.nationalgallery.org.uk",
      isApproved: true,
      isActive: true,
      isFeatured: false,
      libraryType: "history",
      coordinates: { lat: 51.5089, lng: -0.1283 },
    });

    const library3 = await this.createLibrary({
      name: "Library of Science and Innovation",
      description: "Interactive exhibits showcasing technological advances through the ages.",
      location: "2-3-1 Aomi, Koto",
      city: "Tokyo",
      country: "Japan",
      logoUrl: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80",
      featuredImageUrl: "https://images.unsplash.com/photo-1594184888386-ddc5e5f0ff3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
      website: "https://www.miraikan.jst.go.jp/en/",
      isApproved: true,
      isActive: true,
      isFeatured: false,
      libraryType: "science",
      coordinates: { lat: 35.6196, lng: 139.7782 },
    });

    // Create library admin users with hashed passwords
    await this.createUser({
      username: "sarah",
      password: hashSync("pass123", 10),
      email: "sarah.johnson@metlibrary.org",
      fullName: "Sarah Johnson",
      role: "library_admin",
      libraryId: library1.id,
      isActive: true,
    });

    await this.createUser({
      username: "robert",
      password: hashSync("pass123", 10),
      email: "r.garcia@nationalgallery.org",
      fullName: "Robert Garcia",
      role: "library_admin",
      libraryId: library2.id,
      isActive: true,
    });

    await this.createUser({
      username: "emily",
      password: hashSync("pass123", 10),
      email: "e.chen@sciencelibrary.org",
      fullName: "Emily Chen",
      role: "library_admin",
      libraryId: library3.id,
      isActive: true,
    });

    // Create sample stories
    const story1 = await this.createStory({
      libraryId: library1.id,
      title: "The Journey of the Pharaoh's Artifacts",
      content: "<p>Discover the fascinating 3,000-year journey of Egypt's most treasured artifacts from the tombs of the pharaohs to modern librarys. This exhibition traces the discovery, excavation, and preservation of these ancient treasures.</p><p>The collection includes rare items from the tomb of Tutankhamun and other prominent Egyptian rulers, showing the incredible craftsmanship and artistic sensibilities of ancient Egyptian civilization.</p>",
      summary: "Discover the fascinating 3,000-year journey of Egypt's most treasured artifacts from the tombs of the pharaohs to modern librarys...",
      featuredImageUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=600",
      isPublished: true,
      isApproved: true,
      isFeatured: true,
      tags: ["Egypt", "Artifacts", "Ancient History"],
    });

    this.createStory({
      libraryId: library2.id,
      title: "Renaissance Masters: Hidden Techniques",
      content: "<p>Recent restoration work has revealed surprising techniques and hidden details in Renaissance masterpieces. Our curators have documented these findings, giving new insights into how artists like Leonardo da Vinci and Michelangelo created their timeless works.</p><p>Using modern technology including X-ray and infrared imaging, we've uncovered preliminary sketches, compositional changes, and unique painting techniques that weren't visible before.</p>",
      summary: "Recent restoration work has revealed surprising techniques and hidden details in Renaissance masterpieces...",
      featuredImageUrl: "https://images.unsplash.com/photo-1585254166643-0e542d57aeba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
      isPublished: true,
      isApproved: true,
      isFeatured: false,
      tags: ["Renaissance", "Art Restoration", "Painting Techniques"],
    });

    this.createStory({
      libraryId: library3.id,
      title: "Computing Through the Ages",
      content: "<p>From the abacus to quantum computing - explore our new interactive timeline tracing humanity's computing journey. See the evolution of computational devices from ancient civilizations to modern supercomputers.</p><p>This exhibition features working models of historical calculating devices, vintage computers, and demonstrations of modern computing principles. Visitors can interact with many of the exhibits, gaining hands-on experience with these technologies.</p>",
      summary: "From the abacus to quantum computing - explore our new interactive timeline tracing humanity's computing journey...",
      featuredImageUrl: "https://images.unsplash.com/photo-1635352576155-79602be5653d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
      isPublished: true,
      isApproved: true,
      isFeatured: false,
      tags: ["Computing", "Technology", "Interactive"],
    });

    // Create timeline for the first story
    this.createTimeline({
      storyId: story1.id,
      title: "Evolution of Modern Art",
      description: "Key movements and innovations in modern art history",
      timelinePoints: [
        {
          date: "1870s",
          title: "Impressionism",
          description: "Led by Monet, Renoir, and Degas, Impressionism marked the beginning of modern art movements with its emphasis on light, color, and everyday scenes."
        },
        {
          date: "1905-1910",
          title: "Fauvism & Cubism",
          description: "Matisse pioneered Fauvism with its bold colors, while Picasso and Braque developed Cubism, breaking objects into geometric shapes viewed from multiple angles."
        },
        {
          date: "1940s-1950s",
          title: "Abstract Expressionism",
          description: "Dominated by artists like Jackson Pollock and Mark Rothko, this movement emphasized spontaneous creation and emotional intensity through non-representational forms."
        },
        {
          date: "1960s-Present",
          title: "Contemporary Art",
          description: "From Pop Art to Minimalism to Digital Art, contemporary movements continue to push boundaries of what constitutes art in the modern era."
        }
      ]
    });

    // Create sample media items
    this.createMediaItem({
      libraryId: library1.id,
      title: "Renaissance Painting Detail",
      description: "Close-up of a masterpiece showing the intricate brushwork",
      mediaType: "image",
      url: "https://images.unsplash.com/photo-1585254166643-0e542d57aeba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      isApproved: true,
      galleryId: "renaissance",
      tags: ["Renaissance", "Painting", "Detail"]
    });

    this.createMediaItem({
      libraryId: library1.id,
      title: "Historical Sculpture",
      description: "Classical sculpture from the library's permanent collection",
      mediaType: "image",
      url: "https://images.unsplash.com/photo-1620662736427-b8a198f52a4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      isApproved: true,
      galleryId: "renaissance",
      tags: ["Sculpture", "Classical", "Marble"]
    });

    this.createMediaItem({
      libraryId: library1.id,
      title: "Metropolitan Library Gallery",
      description: "Main gallery of the Metropolitan Library of Modern Art",
      mediaType: "image",
      url: "https://images.unsplash.com/photo-1587334207809-304d0bfb4c4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      isApproved: true,
      galleryId: "main",
      tags: ["Gallery", "Interior", "Architecture"]
    });

    // Create sample events
    this.createEvent({
      libraryId: library1.id,
      title: "Women in Abstract Expressionism",
      description: "A special exhibition highlighting the contributions of women artists to the Abstract Expressionist movement.",
      eventDate: new Date("2023-08-30"),
      isPublished: true,
      isApproved: true,
      location: "Main Gallery, Floor 2",
    });

    this.createEvent({
      libraryId: library1.id,
      title: "Digital Frontiers: New Media Art",
      description: "Explore cutting-edge digital art forms including interactive installations, virtual reality experiences, and AI-generated artwork.",
      eventDate: new Date("2023-10-15"),
      isPublished: true,
      isApproved: true,
      location: "Modern Wing, Floor 3",
    });

    // Create more comprehensive media items
    this.createMediaItem({
      libraryId: library1.id,
      title: "Van Gogh Exhibition Video Tour",
      description: "Interactive video tour of our Van Gogh special exhibition",
      mediaType: "video",
      url: "https://example.com/video/vangogh-tour.mp4",
      isApproved: true,
      galleryId: "special-exhibitions",
      tags: ["Van Gogh", "Video Tour", "Interactive"]
    });

    this.createMediaItem({
      libraryId: library1.id,
      title: "Audio Guide - Modern Masters",
      description: "Complete audio guide for the Modern Masters collection",
      mediaType: "audio",
      url: "https://example.com/audio/modern-masters.mp3",
      isApproved: true,
      galleryId: "modern-masters",
      tags: ["Audio Guide", "Modern Art", "Accessibility"]
    });

    this.createMediaItem({
      libraryId: library1.id,
      title: "Exhibition Catalog PDF",
      description: "Digital catalog for the Contemporary Art exhibition",
      mediaType: "document",
      url: "https://example.com/docs/contemporary-catalog.pdf",
      isApproved: false,
      galleryId: "contemporary",
      tags: ["Catalog", "PDF", "Contemporary"]
    });

    this.createMediaItem({
      libraryId: library2.id,
      title: "Ancient Artifacts Collection",
      description: "High-resolution images of our Egyptian artifact collection",
      mediaType: "image",
      url: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      isApproved: true,
      galleryId: "ancient-egypt",
      tags: ["Egypt", "Artifacts", "Ancient History"]
    });

    this.createMediaItem({
      libraryId: library2.id,
      title: "Medieval Manuscripts Documentary",
      description: "Behind-the-scenes look at manuscript preservation",
      mediaType: "video",
      url: "https://example.com/video/medieval-manuscripts.mp4",
      isApproved: false,
      galleryId: "medieval",
      tags: ["Medieval", "Manuscripts", "Documentary"]
    });

    this.createMediaItem({
      libraryId: library3.id,
      title: "Robotics Evolution Timeline",
      description: "Interactive timeline showing 50 years of robotics development",
      mediaType: "image",
      url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      isApproved: true,
      galleryId: "robotics",
      tags: ["Robotics", "Technology", "Timeline"]
    });

    // Create more comprehensive events
    this.createEvent({
      libraryId: library1.id,
      title: "Art Workshop: Watercolor Techniques",
      description: "Learn traditional watercolor painting techniques from professional artists. All skill levels welcome. Materials provided.",
      eventDate: new Date("2024-01-15"),
      isPublished: true,
      isApproved: true,
      location: "Education Center, Room A",
    });

    this.createEvent({
      libraryId: library1.id,
      title: "Late Night at the Library",
      description: "Special after-hours event featuring live jazz music, curator talks, and exclusive access to new exhibitions.",
      eventDate: new Date("2024-02-10"),
      isPublished: false,
      isApproved: false,
      location: "Main Atrium",
    });

    this.createEvent({
      libraryId: library2.id,
      title: "Medieval History Lecture Series",
      description: "Monthly lecture series exploring different aspects of medieval life, culture, and art.",
      eventDate: new Date("2024-01-20"),
      isPublished: true,
      isApproved: true,
      location: "Auditorium",
    });

    this.createEvent({
      libraryId: library3.id,
      title: "Science Fair for Kids",
      description: "Interactive science demonstrations and hands-on experiments for children aged 6-12.",
      eventDate: new Date("2024-01-25"),
      isPublished: true,
      isApproved: true,
      location: "Interactive Learning Lab",
    });

    // Create comprehensive contact messages and responses
    this.createContactMessage({
      libraryId: library1.id,
      name: "John Blackwell",
      email: "john.blackwell@example.com",
      subject: "School Visit Inquiry",
      message: "I'm a teacher at Lincoln High School and would like to arrange a guided tour for my class of 25 students next month. Do you offer educational programs or specialized tours for high school art students?",
      responseStatus: "responded"
    });

    this.createContactMessage({
      libraryId: library1.id,
      name: "Sarah Chen",
      email: "sarah.chen@email.com",
      subject: "Wedding Photography Permission",
      message: "Hello, I'm getting married in June and would love to take some engagement photos in your beautiful sculpture garden. Could you please let me know your policy on photography and any fees involved?",
      responseStatus: "pending"
    });

    this.createContactMessage({
      libraryId: library1.id,
      name: "Dr. Michael Rodriguez",
      email: "m.rodriguez@university.edu",
      subject: "Research Collaboration",
      message: "I'm a professor of Art History at State University. I'm interested in collaborating on research related to your Renaissance collection. Would it be possible to schedule a meeting to discuss potential partnerships?",
      responseStatus: "not_responded"
    });

    this.createContactMessage({
      libraryId: library2.id,
      name: "Emma Thompson",
      email: "emma.t@example.com",
      subject: "Accessibility Services",
      message: "My elderly mother uses a wheelchair and has hearing difficulties. What accessibility services do you offer for visitors with disabilities? Do you have wheelchair-accessible routes and hearing assistance devices?",
      responseStatus: "responded"
    });

    const contactMessage = await this.createContactMessage({
      libraryId: library3.id,
      name: "Tech Corp Inc",
      email: "partnerships@techcorp.com",
      subject: "Corporate Sponsorship Inquiry",
      message: "We're interested in sponsoring your upcoming technology exhibition. Our company specializes in AI and machine learning solutions. Could we discuss potential sponsorship opportunities and partnership benefits?",
      responseStatus: "not_responded"
    });

    // Create message responses
    const messages = [...this.contactMessages.values()];
    if (messages.length) {
      this.createMessageResponse({
        contactMessageId: messages[0].id,
        respondedBy: "Sarah Martinez",
        subject: "Re: School Visit Inquiry - Educational Tours Available",
        message: "Thank you for your inquiry about educational tours. We offer specialized programs for high school students including guided tours focused on art techniques and historical context. Our education coordinator will contact you within 2 business days to discuss scheduling and group rates.",
        templateUsed: [...this.emailTemplates.values()][0]?.id
      });
    }

    // const message4 = this.contactMessages.get(4);
    if (messages[1]) {
      this.createMessageResponse({
        contactMessageId: messages[1].id,
        respondedBy: "Sarah Martinez",
        subject: "Re: Accessibility Services Inquiry",
        message: "We're delighted you're interested in visiting with your mother. Our library is fully wheelchair accessible with ramps and elevators throughout. We also offer hearing assistance devices and large-print guides. Please contact our visitor services team at least 24 hours before your visit to reserve accessibility equipment.",
        templateUsed: [...this.emailTemplates.values()][0]?.id
      });
    }

    // Create comprehensive library stories with real content
    this.createStory({
      libraryId: library1.id,
      title: "The Discovery of Tutankhamun's Tomb: A Century Later",
      content: `<div class="story-content">
        <p class="lead">On November 4, 1922, Howard Carter's team made one of the most significant archaeological discoveries of the 20th century when they uncovered the entrance to Tutankhamun's tomb in the Valley of the Kings.</p>
        
        <h3>The Moment of Discovery</h3>
        <p>Carter famously described what he saw when he first peered into the tomb: "Yes, wonderful things!" The tomb contained over 5,000 artifacts, including the famous golden burial mask, chariots, weapons, clothing, and furniture—all remarkably preserved after more than 3,000 years.</p>
        
        <h3>The Boy King's Legacy</h3>
        <p>Tutankhamun ruled Egypt from approximately 1332 to 1323 BCE during the 18th Dynasty. Despite his short reign and relatively minor historical impact, his tomb's discovery provided unprecedented insight into ancient Egyptian burial practices and royal life.</p>
        
        <h3>Conservation Challenges</h3>
        <p>The artifacts required extensive conservation work. Many items were fragile after millennia underground, and the excavation took nearly a decade to complete. Today, advanced techniques including CT scanning and 3D modeling help us understand these treasures without causing damage.</p>
        
        <h3>Modern Impact</h3>
        <p>The discovery sparked worldwide Egyptomania and fundamentally changed our understanding of ancient Egyptian civilization. It demonstrated the sophistication of their craftsmanship and the elaborate nature of royal burials.</p>
      </div>`,
      summary: "Explore the centennial legacy of Howard Carter's discovery of Tutankhamun's tomb and its lasting impact on archaeology and our understanding of ancient Egypt.",
      featuredImageUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
      isPublished: true,
      isApproved: true,
      isFeatured: true,
      tags: ["Archaeology", "Ancient Egypt", "Tutankhamun", "Discovery"],
    });

    this.createStory({
      libraryId: library1.id,
      title: "Van Gogh's Lost Years: New Revelations from X-Ray Analysis",
      content: `<div class="story-content">
        <p class="lead">Recent X-ray analysis of Vincent van Gogh's paintings has revealed hidden compositions beneath the visible surface, offering new insights into the artist's creative process and economic struggles.</p>
        
        <h3>Hidden Masterpieces</h3>
        <p>Using advanced X-ray fluorescence imaging, conservators have discovered that Van Gogh often painted over his earlier works. This was likely due to the high cost of canvas and his frequent financial difficulties. Several paintings contain complete compositions beneath the surface layer.</p>
        
        <h3>Technical Innovation</h3>
        <p>Van Gogh's technique was more experimental than previously understood. The hidden layers show him testing different color combinations and brushwork styles before settling on the final composition. These discoveries challenge traditional narratives about his artistic development.</p>
        
        <h3>The Arles Period</h3>
        <p>Many of the hidden paintings date to Van Gogh's time in Arles (1888-1889), one of his most productive periods. The underlying works include portraits, still lifes, and landscape studies that provide context for his better-known masterpieces from this time.</p>
        
        <h3>Preservation Implications</h3>
        <p>These discoveries raise important questions about conservation ethics. Should librarys attempt to reveal these hidden works, or preserve the paintings as Van Gogh left them? Each approach offers different insights into the artist's intentions and legacy.</p>
      </div>`,
      summary: "X-ray analysis reveals hidden paintings beneath Van Gogh's masterpieces, offering unprecedented insights into his creative process and artistic development.",
      featuredImageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
      isPublished: true,
      isApproved: true,
      isFeatured: true,
      tags: ["Van Gogh", "Conservation", "X-ray Analysis", "Art History"],
    });

    this.createStory({
      libraryId: library2.id,
      title: "The Rosetta Stone: Deciphering Ancient Languages",
      content: `<div class="story-content">
        <p class="lead">Discovered in 1799 during Napoleon's Egyptian campaign, the Rosetta Stone became the key to understanding hieroglyphic writing and unlocking thousands of years of Egyptian history.</p>
        
        <h3>Three Scripts, One Message</h3>
        <p>The stone contains the same decree written in three scripts: ancient Greek, Demotic, and hieroglyphic. This trilingual inscription provided scholars with the crucial parallel texts needed to decipher hieroglyphs, which had been unreadable for over 1,400 years.</p>
        
        <h3>Champollion's Breakthrough</h3>
        <p>French scholar Jean-François Champollion made the decisive breakthrough in 1822 when he realized that hieroglyphs represented both sounds and ideas. His work built on earlier contributions from Thomas Young and others, but Champollion's systematic approach finally cracked the code.</p>
        
        <h3>The Ptolemaic Decree</h3>
        <p>The text itself commemorates the first anniversary of the coronation of Ptolemy V (205-180 BCE). While historically modest, this administrative document opened the door to understanding the entire corpus of ancient Egyptian literature, religion, and administration.</p>
        
        <h3>Modern Digital Preservation</h3>
        <p>Today, the British Library uses advanced 3D scanning and digital photography to study the stone without physical handling. These techniques reveal details invisible to the naked eye and ensure the preservation of this irreplaceable artifact for future generations.</p>
        
        <h3>Ongoing Discoveries</h3>
        <p>Decipherment of Egyptian hieroglyphs continues to yield new discoveries. Recently translated texts have revealed details about daily life, scientific knowledge, and cultural practices that transform our understanding of ancient Egyptian civilization.</p>
      </div>`,
      summary: "The story of how the Rosetta Stone unlocked the secrets of ancient Egyptian hieroglyphs and revolutionized our understanding of one of history's greatest civilizations.",
      featuredImageUrl: "https://images.unsplash.com/photo-1471919743851-c4df8b6ee133?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
      isPublished: true,
      isApproved: true,
      isFeatured: false,
      tags: ["Linguistics", "Ancient Egypt", "Rosetta Stone", "Archaeology"],
    });

    this.createStory({
      libraryId: library2.id,
      title: "Medieval Manuscripts: Illuminating the Dark Ages",
      content: `<div class="story-content">
        <p class="lead">Contrary to their name, the "Dark Ages" were a period of remarkable artistic and intellectual achievement, as evidenced by the stunning illuminated manuscripts preserved in our collection.</p>
        
        <h3>The Art of Illumination</h3>
        <p>Medieval scribes and artists created some of the most beautiful books ever made. These manuscripts combined religious devotion with artistic excellence, featuring gold leaf, vibrant pigments, and intricate decorative borders that took months or years to complete.</p>
        
        <h3>The Book of Kells</h3>
        <p>Perhaps the most famous illuminated manuscript, the Book of Kells (c. 800 CE) contains the four Gospels with extraordinary decorative detail. Each page demonstrates the sophisticated artistic traditions of Celtic monasteries and their fusion with Christian iconography.</p>
        
        <h3>Scientific Preservation</h3>
        <p>Modern conservation techniques help preserve these fragile documents. Controlled lighting, temperature, and humidity protect the organic materials—parchment, ink, and paint—from deterioration. Digital imaging now allows scholars worldwide to study these treasures without physical access.</p>
        
        <h3>Hidden Knowledge</h3>
        <p>Many manuscripts contain marginalia—notes, drawings, and commentaries added by medieval readers. These annotations provide insight into how people understood and interpreted texts, revealing the intellectual life of medieval society beyond the official narratives.</p>
        
        <h3>Cultural Exchange</h3>
        <p>Illuminated manuscripts demonstrate the extensive cultural exchange in medieval Europe. Islamic geometric patterns, Byzantine artistic techniques, and local folk traditions all influenced these works, showing that the medieval world was far more connected than often assumed.</p>
      </div>`,
      summary: "Explore the sophisticated artistry and hidden knowledge within medieval illuminated manuscripts, revealing the rich intellectual and cultural life of the so-called Dark Ages.",
      featuredImageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
      isPublished: true,
      isApproved: true,
      isFeatured: true,
      tags: ["Medieval History", "Manuscripts", "Art", "Christianity"],
    });

    this.createStory({
      libraryId: library3.id,
      title: "The Antikythera Mechanism: Ancient Computer Revealed",
      content: `<div class="story-content">
        <p class="lead">Discovered in a Roman shipwreck in 1901, the Antikythera Mechanism has revolutionized our understanding of ancient Greek technological sophistication, revealing capabilities that wouldn't be seen again for over a millennium.</p>
        
        <h3>An Unexpected Discovery</h3>
        <p>Greek sponge divers found the corroded bronze device among treasures from a first-century BCE shipwreck off the island of Antikythera. For decades, its purpose remained mysterious, with some dismissing it as a simple astrolabe or navigational instrument.</p>
        
        <h3>Mechanical Marvel</h3>
        <p>Modern analysis using CT scanning and 3D modeling has revealed an intricate system of at least 37 bronze gears. This analog computer could predict the positions of the sun, moon, and planets, as well as lunar and solar eclipses, with remarkable accuracy.</p>
        
        <h3>Scientific Sophistication</h3>
        <p>The mechanism incorporated advanced mathematical concepts including the Metonic cycle (235 lunar months = 19 solar years) and the Callippic cycle. It demonstrates that ancient Greeks possessed sophisticated understanding of astronomical cycles and mechanical engineering.</p>
        
        <h3>Technological Timeline</h3>
        <p>Nothing comparable to the Antikythera Mechanism appears in the historical record until mechanical astronomical clocks in medieval Europe—over 1,000 years later. This gap suggests either that similar devices were lost to history or that the mechanism represents unique technological achievement.</p>
        
        <h3>Modern Reconstructions</h3>
        <p>Engineers and historians have built working replicas based on the surviving fragments and ancient astronomical knowledge. These reconstructions confirm the device's remarkable capabilities and highlight the ingenuity of its unknown creators.</p>
        
        <h3>Ongoing Research</h3>
        <p>New imaging techniques continue to reveal inscriptions and mechanical details. Recent discoveries include a 223-month eclipse prediction cycle and evidence of planetary motion calculations, suggesting the device was even more sophisticated than previously thought.</p>
      </div>`,
      summary: "The Antikythera Mechanism reveals ancient Greek technological sophistication far beyond what was thought possible, functioning as the world's first analog computer.",
      featuredImageUrl: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
      isPublished: true,
      isApproved: true,
      isFeatured: true,
      tags: ["Ancient Greece", "Technology", "Archaeology", "Astronomy"],
    });

    this.createStory({
      libraryId: library3.id,
      title: "Marie Curie's Laboratory: Radioactivity's Pioneer",
      content: `<div class="story-content">
        <p class="lead">Marie Curie's laboratory equipment, still radioactive after more than a century, provides tangible connection to the groundbreaking research that earned her two Nobel Prizes and revolutionized our understanding of atomic physics.</p>
        
        <h3>Breaking Barriers</h3>
        <p>Marie Curie (1867-1934) was the first woman to win a Nobel Prize, the first person to win Nobel Prizes in two different sciences (Physics in 1903, Chemistry in 1911), and remains the only person to achieve this distinction across different scientific disciplines.</p>
        
        <h3>The Discovery of Radium</h3>
        <p>Working with her husband Pierre in a converted shed, Curie processed tons of pitchblende ore to isolate radium. The painstaking work involved stirring boiling masses with iron rods nearly as tall as herself, demonstrating both scientific dedication and physical endurance.</p>
        
        <h3>Laboratory Artifacts</h3>
        <p>Curie's notebooks, laboratory equipment, and even her cookbooks remain radioactive today, requiring special storage in lead-lined boxes. These artifacts will remain hazardous for another 1,500 years, a testament to her pioneering work with radioactive materials.</p>
        
        <h3>Medical Applications</h3>
        <p>Curie recognized the medical potential of radioactivity early on. During World War I, she developed mobile X-ray units called "petites Curies," personally driving them to the front lines and training military doctors in their use, saving countless lives.</p>
        
        <h3>Scientific Legacy</h3>
        <p>Her research laid the foundation for atomic physics, nuclear chemistry, and modern medical treatments including cancer radiotherapy. The element Curium and the unit of radioactivity Curie are named in her honor.</p>
        
        <h3>Personal Sacrifice</h3>
        <p>Curie's dedication to science ultimately cost her life—she died of aplastic anemia, likely caused by radiation exposure. Her sacrifice highlighted the need for safety protocols in scientific research and demonstrated the courage required for groundbreaking discovery.</p>
      </div>`,
      summary: "Marie Curie's radioactive laboratory artifacts tell the story of groundbreaking scientific discovery, personal sacrifice, and the dawn of the atomic age.",
      featuredImageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
      isPublished: true,
      isApproved: true,
      isFeatured: false,
      tags: ["Marie Curie", "Physics", "Chemistry", "Women in Science"],
    });

    this.createStory({
      libraryId: library1.id,
      title: "The Stolen Mona Lisa: Art Crime of the Century",
      content: `<div class="story-content">
        <p class="lead">On August 21, 1911, Leonardo da Vinci's Mona Lisa vanished from the Louvre, sparking an international manhunt and transforming a relatively unknown painting into the world's most famous artwork.</p>
        
        <h3>The Heist</h3>
        <p>Vincenzo Peruggia, an Italian handyman who had worked at the Louvre, simply walked out with the painting hidden under his coat on a Monday when the library was closed for maintenance. The theft wasn't discovered until the next day when artist Louis Béroud noticed the empty wall space.</p>
        
        <h3>International Sensation</h3>
        <p>The theft created a media frenzy. Newspapers worldwide featured the story, and thousands of people flocked to the Louvre to see the empty space where the Mona Lisa had hung. Ironically, the theft made the painting more famous than it had ever been while hanging on the library wall.</p>
        
        <h3>False Accusations</h3>
        <p>The investigation led to several false arrests, including poet Guillaume Apollinaire and even Pablo Picasso, who was questioned about his possible involvement. The real perpetrator remained free for over two years.</p>
        
        <h3>The Recovery</h3>
        <p>Peruggia was caught in 1913 when he attempted to sell the painting to an art dealer in Florence. He claimed he stole it to return it to Italy, believing it had been wrongfully taken by Napoleon (though Leonardo actually brought it to France himself).</p>
        
        <h3>Cultural Impact</h3>
        <p>The theft fundamentally changed how we think about art security and the cultural value of masterpieces. Librarys worldwide revised their security protocols, and the incident highlighted the international importance of protecting cultural heritage.</p>
        
        <h3>The Mona Lisa's Fame</h3>
        <p>Before the theft, the Mona Lisa was just one of many Renaissance paintings in the Louvre. The international attention from the crime, combined with subsequent events including attacks and worldwide exhibitions, transformed it into an icon of Western art.</p>
      </div>`,
      summary: "The 1911 theft of the Mona Lisa from the Louvre transformed a Renaissance painting into the world's most famous artwork and revolutionized library security.",
      featuredImageUrl: "https://images.unsplash.com/photo-1578946956088-940fa4d58461?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
      isPublished: true,
      isApproved: true,
      isFeatured: false,
      tags: ["Art Crime", "Mona Lisa", "Leonardo da Vinci", "Library Security"],
    });

    this.createStory({
      libraryId: library3.id,
      title: "Computing Through the Ages",
      content: "<p>From the abacus to quantum computing - explore our new interactive timeline tracing humanity's computing journey. See the evolution of computational devices from ancient civilizations to modern supercomputers.</p><p>This exhibition features working models of historical calculating devices, vintage computers, and demonstrations of modern computing principles. Visitors can interact with many of the exhibits, gaining hands-on experience with these technologies.</p>",
      summary: "From the abacus to quantum computing - explore our new interactive timeline tracing humanity's computing journey...",
      featuredImageUrl: "https://images.unsplash.com/photo-1635352576155-79602be5653d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
      isPublished: true,
      isApproved: true,
      isFeatured: false,
      tags: ["Computing", "Technology", "Interactive"],
    });

    // Create email templates for different scenarios
    this.createEmailTemplate({
      libraryId: library1.id,
      name: "School Visit Response",
      subject: "Re: School Visit Inquiry - Educational Tours Available",
      content: `
        <h2>Thank you for your interest in educational visits!</h2>
        <p>Dear {{visitorName}},</p>
        <p>We're excited to learn about your interest in bringing students to {{libraryName}}. Our education department offers specialized programs designed specifically for high school students.</p>
        
        <h3>What we offer:</h3>
        <ul>
          <li>Guided tours with certified education specialists</li>
          <li>Interactive workshops and hands-on activities</li>
          <li>Curriculum-aligned content for art history and visual arts</li>
          <li>Group rates and flexible scheduling</li>
        </ul>
        
        <p>Our education coordinator will contact you within 2 business days to discuss your specific needs and schedule your visit.</p>
        
        <p>Best regards,<br>
        {{libraryName}} Education Team</p>
      `,
      isDefault: false
    });

    this.createEmailTemplate({
      libraryId: library1.id,
      name: "General Inquiry Response",
      subject: "Thank you for contacting {{libraryName}}",
      content: `
        <h2>Thank you for reaching out!</h2>
        <p>Dear {{visitorName}},</p>
        <p>We've received your message regarding: {{originalSubject}}</p>
        <p>{{responseMessage}}</p>
        <p>If you have any additional questions, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br>
        The {{libraryName}} Team</p>
      `,
      isDefault: true
    });

    this.createEmailTemplate({
      libraryId: library2.id,
      name: "Research Collaboration",
      subject: "Re: Research Collaboration Opportunity",
      content: `
        <h2>Research Collaboration Opportunity</h2>
        <p>Dear {{visitorName}},</p>
        <p>Thank you for your interest in collaborating with {{libraryName}}. We value academic partnerships and are always interested in meaningful research collaborations.</p>
        
        <p>Our curatorial team would be happy to discuss potential research opportunities related to our collections. Please contact our Director of Collections at research@library.org to schedule a meeting.</p>
        
        <p>We look forward to exploring this collaboration.</p>
        
        <p>Sincerely,<br>
        {{libraryName}} Research Department</p>
      `,
      isDefault: false
    });

    // Create analytics data for dashboard insights
    const currentDate = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);

      // Analytics for library 1
      this.incrementAnalytics({
        libraryId: library1.id,
        pageType: "home",
        views: Math.floor(Math.random() * 50) + 10,
        // uniqueVisitors: Math.floor(Math.random() * 40) + 8,
        storyId: story1?.id,
        createdAt: date.toISOString()
      });

      this.incrementAnalytics({
        libraryId: library1.id,
        pageType: "stories",
        views: Math.floor(Math.random() * 30) + 5,
        // uniqueVisitors: Math.floor(Math.random() * 25) + 4,
        storyId: story1?.id,
        createdAt: date.toISOString()
      });
      this.incrementAnalytics({
        libraryId: library1.id,
        pageType: "gallery",
        views: Math.floor(Math.random() * 40) + 8,
        // uniqueVisitors: Math.floor(Math.random() * 35) + 6,
        storyId: story1?.id,
        createdAt: date.toISOString()
      });
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUsersByLibraryId(libraryId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.libraryId === libraryId
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = uuidv4()
    const user: User = { ...insertUser, id, lastLoginAt: new Date().toISOString() } as User;
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Library methods
  async getLibrary(id: string): Promise<Library | undefined> {
    return this.librarys.get(id);
  }

  async getLibraryByName(name: string): Promise<Library | undefined> {
    return Array.from(this.librarys.values()).find(
      (library) => library.name === name
    );
  }

  async getLibraries(options?: {
    approved?: boolean;
    featured?: boolean;
    type?: string;
    active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Library[]> {
    let librarys = Array.from(this.librarys.values());

    if (options?.approved !== undefined) {
      librarys = librarys.filter(library => library.isApproved === options.approved);
    }

    if (options?.featured !== undefined) {
      librarys = librarys.filter(library => library.isFeatured === options.featured);
    }

    if (options?.type) {
      librarys = librarys.filter(library => library.libraryType === options.type);
    }

    if (options?.active !== undefined) {
      librarys = librarys.filter(library => library.isActive === options.active);
    }

    // Apply pagination
    if (options?.offset !== undefined && options?.limit !== undefined) {
      librarys = librarys.slice(options.offset, options.offset + options.limit);
    } else if (options?.limit !== undefined) {
      librarys = librarys.slice(0, options.limit);
    }

    return librarys;
  }

  async getTotalLibraries(options?: {
    approved?: boolean;
    featured?: boolean;
    type?: string
  }): Promise<number> {
    let librarys = Array.from(this.librarys.values());

    if (options?.approved !== undefined) {
      librarys = librarys.filter(library => library.isApproved === options.approved);
    }

    if (options?.featured !== undefined) {
      librarys = librarys.filter(library => library.isFeatured === options.featured);
    }

    if (options?.type) {
      librarys = librarys.filter(library => library.libraryType === options.type);
    }

    return librarys.length;
  }

  async createLibrary(insertLibrary: InsertLibrary): Promise<Library> {
    const id = uuidv4();
    const library: Library = { ...insertLibrary, id, createdAt: new Date().toISOString() } as Library;
    this.librarys.set(id, library);
    return library;
  }

  async updateLibrary(id: string, data: Partial<Library>): Promise<Library | undefined> {
    const library = await this.getLibrary(id);
    if (!library) return undefined;

    const updatedLibrary = { ...library, ...data };
    this.librarys.set(id, updatedLibrary);
    return updatedLibrary;
  }

  // Story methods
  async getStory(id: string): Promise<Story | undefined> {
    return this.stories.get(id);
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
    let stories = Array.from(this.stories.values());

    if (options?.libraryId !== undefined) {
      stories = stories.filter(story => story.libraryId === options.libraryId);
    }

    if (options?.published !== undefined) {
      stories = stories.filter(story => story.isPublished === options.published);
    }

    if (options?.approved !== undefined) {
      stories = stories.filter(story => story.isApproved === options.approved);
    }

    if (options?.featured !== undefined) {
      stories = stories.filter(story => story.isFeatured === options.featured);
    }

    if (options?.tags && options.tags.length > 0) {
      stories = stories.filter(story =>
        options.tags!.some(tag => story.tags?.includes(tag))
      );
    }

    // Sort by published date (most recent first)
    stories.sort((a, b) => {
      if (!a.publishedAt) return 1;
      if (!b.publishedAt) return -1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    // Apply pagination
    if (options?.offset !== undefined && options?.limit !== undefined) {
      stories = stories.slice(options.offset, options.offset + options.limit);
    } else if (options?.limit !== undefined) {
      stories = stories.slice(0, options.limit);
    }

    return stories;
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const id = uuidv4();
    const now = new Date();
    const story: Story = {
      id,
      libraryId: insertStory.libraryId,
      title: insertStory.title,
      content: insertStory.content,
      summary: insertStory.summary,
      createdAt: now,
      updatedAt: now,
      publishedAt: insertStory.isPublished ? now.toISOString() : "",
      isPublished: insertStory.isPublished ?? null,
      isApproved: insertStory.isApproved ?? null,
      isFeatured: insertStory.isFeatured ?? null,
      tags: insertStory.tags ?? null,
      featuredImageUrl: insertStory.featuredImageUrl ?? null
    };
    this.stories.set(id, story);
    return story;
  }

  async updateStory(id: string, data: Partial<Story>): Promise<Story | undefined> {
    const story = await this.getStory(id);
    if (!story) return undefined;

    // If story is being published, set the publishedAt date
    if (data.isPublished && !story.isPublished) {
      data.publishedAt = new Date().toISOString();
    } else if (!data.isPublished && story.isPublished) {
      data.publishedAt = ""
    }

    const updatedStory = {
      ...story,
      ...data,
      updatedAt: new Date()
    };
    this.stories.set(id, updatedStory);
    return updatedStory;
  }

  async deleteStory(id: string): Promise<boolean> {
    return this.stories.delete(id);
  }

  // Media item methods
  async getMediaItem(id: string): Promise<MediaItem | undefined> {
    return this.mediaItems.get(id);
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
    let items = Array.from(this.mediaItems.values());

    if (options?.libraryId !== undefined) {
      items = items.filter(item => item.libraryId === options.libraryId);
    }

    if (options?.galleryId) {
      items = items.filter(item => item.galleryId === options.galleryId);
    }

    if (options?.approved !== undefined) {
      items = items.filter(item => item.isApproved === options.approved);
    }

    if (options?.mediaType) {
      items = items.filter(item => item.mediaType === options.mediaType);
    }

    if (options?.tags && options.tags.length > 0) {
      items = items.filter(item =>
        item.tags && options.tags!.some(tag => item.tags?.includes(tag))
      );
    }

    // Apply pagination
    if (options?.offset !== undefined && options?.limit !== undefined) {
      items = items.slice(options.offset, options.offset + options.limit);
    } else if (options?.limit !== undefined) {
      items = items.slice(0, options.limit);
    }

    return items;
  }

  async createMediaItem(insertMediaItem: InsertMediaItem): Promise<MediaItem> {
    const id = uuidv4();
    const mediaItem: MediaItem = { ...insertMediaItem, id, createdAt: new Date().toISOString() } as MediaItem;
    this.mediaItems.set(id, mediaItem);
    return mediaItem;
  }

  async updateMediaItem(id: string, data: Partial<MediaItem>): Promise<MediaItem | undefined> {
    const mediaItem = await this.getMediaItem(id);
    if (!mediaItem) return undefined;

    const updatedMediaItem = { ...mediaItem, ...data };
    this.mediaItems.set(id, updatedMediaItem);
    return updatedMediaItem;
  }

  async deleteMediaItem(id: string): Promise<boolean> {
    return this.mediaItems.delete(id);
  }

  // Timeline methods
  async getTimeline(id: string): Promise<Timeline | undefined> {
    return this.timelines.get(id);
  }

  async getTimelinesByStoryId(storyId: string): Promise<Timeline[]> {
    return Array.from(this.timelines.values()).filter(
      timeline => timeline.storyId === storyId
    );
  }

  async createTimeline(insertTimeline: InsertTimeline): Promise<Timeline> {
    const id = uuidv4();
    const now = new Date();
    const timeline: Timeline = {
      ...insertTimeline,
      id,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    } as Timeline;
    this.timelines.set(id, timeline);
    return timeline;
  }

  async updateTimeline(id: string, data: Partial<Timeline>): Promise<Timeline | undefined> {
    const timeline = await this.getTimeline(id);
    if (!timeline) return undefined;

    const updatedTimeline = {
      ...timeline,
      ...data,
      updatedAt: new Date().toISOString()
    };
    this.timelines.set(id, updatedTimeline);
    return updatedTimeline;
  }

  async deleteTimeline(id: string): Promise<boolean> {
    return this.timelines.delete(id);
  }

  // Event methods
  async getEvent(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getEvents(options?: {
    libraryId?: string;
    published?: boolean;
    approved?: boolean;
    upcoming?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Event[]> {
    let events = Array.from(this.events.values());

    if (options?.libraryId !== undefined) {
      events = events.filter(event => event.libraryId === options.libraryId);
    }

    if (options?.published !== undefined) {
      events = events.filter(event => event.isPublished === options.published);
    }

    if (options?.approved !== undefined) {
      events = events.filter(event => event.isApproved === options.approved);
    }

    if (options?.upcoming !== undefined && options.upcoming) {
      const now = new Date();
      events = events.filter(event => new Date(event.eventDate) > now);
    }

    // Sort by event date (closest upcoming first)
    events.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

    // Apply pagination
    if (options?.offset !== undefined && options?.limit !== undefined) {
      events = events.slice(options.offset, options.offset + options.limit);
    } else if (options?.limit !== undefined) {
      events = events.slice(0, options.limit);
    }

    return events;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = uuidv4();
    const event: Event = { ...insertEvent, id, createdAt: new Date().toISOString() } as Event;
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: string, data: Partial<Event>): Promise<Event | undefined> {
    const event = await this.getEvent(id);
    if (!event) return undefined;

    const updatedEvent = { ...event, ...data };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<boolean> {
    return this.events.delete(id);
  }

  // Contact message methods
  async getContactMessage(id: string): Promise<ContactMessage | undefined> {
    return this.contactMessages.get(id);
  }

  async getContactMessages(options?: {
    libraryId?: string;
    read?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ContactMessage[]> {
    let messages = Array.from(this.contactMessages.values());

    if (options?.libraryId !== undefined) {
      messages = messages.filter(message => message.libraryId === options.libraryId);
    }

    if (options?.read !== undefined) {
      messages = messages.filter(message => message.isRead === options.read);
    }

    // Sort by creation date (newest first)
    messages.sort((a, b) => (b.createdAt && a.createdAt) ?
      (new Date(b.createdAt).getTime()) - new Date(a.createdAt).getTime() :
      0);

    // Apply pagination
    if (options?.offset !== undefined && options?.limit !== undefined) {
      messages = messages.slice(options.offset, options.offset + options.limit);
    } else if (options?.limit !== undefined) {
      messages = messages.slice(0, options.limit);
    }

    return messages;
  }

  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const id = uuidv4();
    const message: ContactMessage = {
      ...insertMessage,
      id,
      isRead: false,
      responseStatus: insertMessage.responseStatus ?? null,
      createdAt: new Date().toISOString()
    };
    this.contactMessages.set(id, message);
    return message;
  }

  async updateContactMessage(id: string, data: Partial<ContactMessage>): Promise<ContactMessage | undefined> {
    const message = await this.getContactMessage(id);
    if (!message) return undefined;

    const updatedMessage = { ...message, ...data };
    this.contactMessages.set(id, updatedMessage);
    return updatedMessage;
  }

  async deleteContactMessage(id: string): Promise<boolean> {
    return this.contactMessages.delete(id);
  }

  // Analytics methods
  async getAnalytics(options: {
    libraryId?: string;
    storyId?: string;
    pageType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Analytics[]> {
    let analytics = Array.from(this.analytics.values());

    if (options.libraryId !== undefined) {
      analytics = analytics.filter(item => item.libraryId === options.libraryId);
    }

    if (options.storyId !== undefined) {
      analytics = analytics.filter(item => item.storyId === options.storyId);
    }

    if (options.pageType) {
      analytics = analytics.filter(item => item.pageType === options.pageType);
    }

    if (options.startDate) {
      analytics = analytics.filter(item => (item.date && options.startDate) && new Date(item.date) >= options.startDate);
    }

    if (options.endDate) {
      analytics = analytics.filter(item => (item.date && options.endDate) && new Date(item.date) <= options.endDate);
    }

    return analytics;
  }

  async incrementAnalytics(data: InsertAnalytics): Promise<Analytics> {
    // Try to find an existing record for this combination
    const existing = Array.from(this.analytics.values()).find(item =>
      item.libraryId === data.libraryId &&
      item.storyId === data.storyId &&
      item.pageType === data.pageType &&
      // Check if date is the same day (ignoring time)
      item.date && new Date(item.date).toDateString() === new Date().toDateString()
    );

    if (existing && existing.views) {
      // Increment the existing record
      const updated = { ...existing, views: existing.views + 1 };
      this.analytics.set(existing.id, updated);
      return updated;
    } else {
      // Create a new record
      const id = uuidv4();
      const newAnalytics: Analytics = {
        ...data,
        id,
        views: 1,
        date: new Date().toISOString()
      } as Analytics;
      this.analytics.set(id, newAnalytics);
      return newAnalytics;
    }
  }

  // Message Responses
  async getMessageResponse(id: string): Promise<MessageResponse | undefined> {
    return this.messageResponses.get(id);
  }

  async getMessageResponsesByContactMessageId(contactMessageId: string): Promise<MessageResponse[]> {
    return Array.from(this.messageResponses.values())
      .filter(response => response.contactMessageId === contactMessageId)
      .sort((a, b) => {
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        return bTime - aTime;
      });
  }

  async createMessageResponse(insertResponse: InsertMessageResponse): Promise<MessageResponse> {
    const id = uuidv4();
    const response: MessageResponse = {
      ...insertResponse,
      id,
      emailSent: false,
      emailSentAt: "",
      templateUsed: insertResponse.templateUsed || null,
      createdAt: new Date().toISOString()
    };
    this.messageResponses.set(id, response);
    return response;
  }

  async updateMessageResponse(id: string, data: Partial<MessageResponse>): Promise<MessageResponse | undefined> {
    const response = this.messageResponses.get(id);
    if (!response) return undefined;

    const updatedResponse = { ...response, ...data };
    this.messageResponses.set(id, updatedResponse);
    return updatedResponse;
  }

  // Email Templates
  async getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    return this.emailTemplates.get(id);
  }

  async getEmailTemplates(options?: { libraryId?: string; isDefault?: boolean }): Promise<EmailTemplate[]> {
    let templates = Array.from(this.emailTemplates.values());

    if (options?.libraryId !== undefined) {
      templates = templates.filter(template => template.libraryId === options.libraryId);
    }

    if (options?.isDefault !== undefined) {
      templates = templates.filter(template => template.isDefault === options.isDefault);
    }

    return templates.sort((a, b) => {
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  async createEmailTemplate(insertTemplate: InsertEmailTemplate): Promise<EmailTemplate> {
    const id = uuidv4();
    const template: EmailTemplate = {
      ...insertTemplate,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: insertTemplate.isDefault ?? null
    };
    this.emailTemplates.set(id, template);
    return template;
  }

  async updateEmailTemplate(id: string, data: Partial<EmailTemplate>): Promise<EmailTemplate | undefined> {
    const template = this.emailTemplates.get(id);
    if (!template) return undefined;

    const updatedTemplate = { ...template, ...data, updatedAt: new Date().toISOString() };
    this.emailTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteEmailTemplate(id: string): Promise<boolean> {
    return this.emailTemplates.delete(id);
  }

}

