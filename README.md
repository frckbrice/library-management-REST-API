# Library Management REST API

A comprehensive RESTful API backend for managing library content, resources, and operations. This system provides a robust platform for libraries to manage their collections, stories, media items, events, and user interactions through a well-structured API.

## Overview

This is a production-ready Node.js backend application built with Express.js, postgresql and TypeScript. It implements a complete content management system for libraries with role-based access control, content moderation, analytics tracking, and email communication capabilities.

## Technology Stack

- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based authentication with bcrypt password hashing
- **File Storage**: Cloudinary for image and media uploads
- **Email Service**: Nodemailer for automated email responses
- **Validation**: Zod for schema validation
- **Rate Limiting**: Express-rate-limit for API protection
- **Session Management**: Express-session with PostgreSQL or memory store

## Features

### Authentication & Authorization
- Session-based user authentication
- Role-based access control (library_admin, super_admin)
- Secure password hashing with bcrypt
- Session management with configurable stores

### Content Management
- **Libraries**: Complete library profile management with location, description, images, and metadata
- **Stories**: Rich text content management with featured images, tags, and approval workflow
- **Timelines**: Interactive timeline creation associated with stories
- **Media Items**: Image, video, and audio management organized into galleries
- **Events**: Library event management with dates, locations, and images

### Moderation System
- Content approval workflow for stories and media items
- Super admin moderation capabilities
- Featured content management
- Publication status control

### Public API
- Public endpoints for browsing libraries, stories, events, and media
- Advanced search functionality
- Filtering by tags, library, published status, and more
- Pagination support

### Communication
- Contact message system for visitor inquiries
- Automated email response system with customizable templates
- Email notification system

### Analytics & Reporting
- View tracking and analytics collection
- Admin dashboard with comprehensive statistics
- Activity logging and monitoring

### Security & Performance
- Rate limiting on all endpoints with different tiers
- CORS configuration for cross-origin requests
- Input validation and sanitization
- Error handling middleware
- Request logging

## Project Structure

```
├── config/
│   ├── bucket-storage/     # Cloudinary configuration
│   ├── cors/               # CORS configuration
│   └── database/           # Database schema, migrations, and seed data
├── middlewares/
│   ├── errors/             # Error handling middleware
│   ├── logger.ts          # Request logging
│   └── rate-limiters.ts   # Rate limiting configuration
├── server/
│   └── routes.ts          # API route definitions
├── services/
│   ├── drizzle-services.ts # Database service layer
│   └── email-service.ts   # Email service implementation
└── utils/
    └── validations.ts      # Validation utilities
```

## Installation

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- pnpm package manager (or npm/yarn)
- Cloudinary account (for file uploads)
- Email service credentials (Gmail or SMTP)

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd library-management-REST-API
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure environment variables:
Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_localURL=postgresql://user:password@localhost:5432/library_db
DATABASE_API_URL=your_neon_dataapi_url_if_using_neon

# Session
SESSION_SECRET=your_session_secret_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Gmail)
GMAIL_USER=your_email@gmail.com
GMAIL_PASS=your_app_password

# Server
PORT=5500
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

4. Set up the database:
```bash
# Generate database migrations
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed the database with sample data
pnpm db:seed
```

5. Start the development server:
```bash
pnpm dev
```

The server will start on `http://localhost:5500` (or the port specified in your `.env` file).

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/session` - Get current session
- `POST /api/v1/auth/logout` - User logout

### Libraries
- `GET /api/v1/libraries` - Get all libraries (public)
- `GET /api/v1/libraries/:id` - Get library by ID (public)
- `POST /api/v1/libraries` - Create library (super_admin only)
- `PATCH /api/v1/libraries/:id` - Update library (admin)

### Stories
- `GET /api/v1/stories` - Get all stories (public, supports filtering)
- `GET /api/v1/stories/:id` - Get story by ID (public)
- `GET /api/v1/stories/tags` - Get all story tags (public)
- `POST /api/v1/admin/stories` - Create story (authenticated)
- `PATCH /api/v1/admin/stories/:id` - Update story (authenticated)
- `GET /api/v1/admin/stories/:id` - Get story for editing (authenticated)

### Timelines
- `GET /api/v1/admin/stories/:id/timelines` - Get timelines for a story
- `POST /api/v1/admin/stories/:id/timelines` - Create timeline for a story

### Media Items
- `GET /api/v1/media-items` - Get all media items (public, supports filtering)
- `GET /api/v1/media-items/:id` - Get media item by ID (public)
- `POST /api/v1/media-items` - Upload media item (authenticated)
- `PATCH /api/v1/media-items/:id` - Update media item (authenticated)

### Events
- `GET /api/v1/events` - Get all events (public)
- `POST /api/v1/events` - Create event (authenticated)
- `PATCH /api/v1/events/:id` - Update event (authenticated)
- `DELETE /api/v1/events/:id` - Delete event (authenticated)

### Contact Messages
- `GET /api/v1/contact-messages` - Get contact messages (authenticated)
- `POST /api/v1/contact-messages` - Submit contact message (public)
- `PATCH /api/v1/contact-messages/:id` - Update message status
- `POST /api/v1/contact-messages/:id/reply` - Send email response

### Super Admin
- `GET /api/v1/superadmin/moderation/stories` - Get stories pending approval
- `GET /api/v1/superadmin/moderation/media` - Get media pending approval
- `PATCH /api/v1/superadmin/stories/:id/approve` - Approve story
- `PATCH /api/v1/superadmin/stories/:id/reject` - Reject story
- `GET /api/v1/superadmin/libraries` - Get all libraries
- `GET /api/v1/superadmin/users` - Get all users
- `POST /api/v1/superadmin/users` - Create user
- `PATCH /api/v1/superadmin/users/:id` - Update user

### Admin Dashboard
- `GET /api/v1/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/v1/admin/dashboard/analytics` - Get analytics data
- `GET /api/v1/admin/dashboard/activity` - Get recent activity

### Utilities
- `GET /api/v1/health` - Health check endpoint
- `GET /api/v1/admin/galleries` - Get all galleries
- `GET /api/v1/admin/media/tags` - Get all media tags

## Database Schema

The application uses PostgreSQL with the following main entities:

- **users**: User accounts with role-based access
- **libraries**: Library profiles and information
- **stories**: Content stories with rich text
- **media_items**: Media files (images, videos, audio)
- **timelines**: Timeline data associated with stories
- **events**: Library events and programs
- **contact_messages**: Visitor contact submissions
- **analytics**: View and engagement tracking
- **email_templates**: Customizable email templates
- **message_responses**: Email response tracking

## Development

### Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build TypeScript to JavaScript
- `pnpm start` - Start production server
- `pnpm check` - Type check without emitting files
- `pnpm lint` - Run ESLint
- `pnpm test` - Run tests
- `pnpm db:push` - Push schema changes to database
- `pnpm db:generate` - Generate database migrations
- `pnpm db:seed` - Seed database with sample data
- `pnpm db:reset` - Reset database

### Code Quality

The project follows TypeScript best practices with:
- Strict type checking
- Consistent code formatting
- Comprehensive error handling
- Input validation using Zod schemas
- RESTful API design principles

## Security Features

- Password hashing with bcrypt
- Session-based authentication
- Rate limiting on all endpoints
- CORS protection
- Input validation and sanitization
- SQL injection prevention through ORM
- Secure file upload handling

## Rate Limiting

The API implements different rate limiting tiers:
- **Public endpoints**: Standard rate limits
- **Admin endpoints**: Stricter rate limits
- **Search endpoints**: Special rate limits for search operations
- **Contact endpoints**: Dedicated rate limits for contact forms
- **Email endpoints**: Rate limits for email sending

## Error Handling

The application includes comprehensive error handling:
- Centralized error handler middleware
- Consistent error response format
- Detailed error logging
- User-friendly error messages

## Contributing

This is a private project. For questions or issues, please contact the development team.

## License

MIT License

## Author

Developed as part of the Library Management System project.
