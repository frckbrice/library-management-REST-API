# Library Management REST API

[![CI](https://github.com/frckbrice/library-management-REST-API/actions/workflows/ci.yml/badge.svg)](https://github.com/frckbrice/library-management-REST-API/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B%20%7C%2022-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

![Library Management REST API](public/images/lib_api_home_page.png)

A production-ready RESTful API for library content management—collections, stories, media, events, and user operations. Built with modern TypeScript, Express.js, and PostgreSQL. Designed for scalability, maintainability, and secure multi-tenant operations.

---

## Overview

This API powers a full content management system for libraries with role-based access control, content moderation, analytics, and email workflows. It follows RESTful design principles, uses type-safe validation, and ships with tinteractive API documentation.

### Highlights

- **Type-safe stack** — TypeScript, Zod schemas, Drizzle ORM with inferred types  
- **CI/CD pipeline** — GitHub Actions (type check, lint, test, build, security audit)  
- **Cloud-ready** — Neon (serverless Postgres), Cloudinary (media), Render deployment  
- **Security-first** — Helmet, CORS, rate limiting, bcrypt, session-based auth  

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js 20+ / 22 |
| **Framework** | Express.js |
| **Language** | TypeScript 5.6 (strict mode) |
| **Database** | PostgreSQL (Neon serverless, `pg`) |
| **ORM** | Drizzle ORM |
| **Validation** | Zod |
| **Auth** | Session-based, bcrypt, express-session |
| **Media** | Cloudinary (multer + multer-storage-cloudinary) |
| **Email** | Nodemailer |
| **API Docs** | Swagger UI (OpenAPI 3) |
| **Security** | Helmet, CORS, express-rate-limit |
| **Tests** | Jest, ts-jest |
| **Package Manager** | pnpm |

---

## Features

### Authentication & Authorization

- Session-based authentication with secure cookie handling  
- Role-based access control: `library_admin`, `super_admin`  
- Bcrypt password hashing  
- Configurable session stores (PostgreSQL, in-memory for dev)  

### Content Management

| Domain | Capabilities |
|--------|--------------|
| **Libraries** | CRUD, location, metadata, images, approval workflow |
| **Stories** | Rich text, featured images, tags, publish/approve lifecycle |
| **Timelines** | Timeline points linked to stories |
| **Media Items** | Images, video, audio; galleries; tags; approval |
| **Events** | Dates, locations, images; full CRUD |

### Moderation & Admin

- Content approval flows for stories and media  
- Super admin moderation and featured content management  
- Admin dashboard: stats, analytics, activity logs  

### Public API

- Public endpoints for libraries, stories, events, media  
- Search, filters (tags, library, status), pagination  
- Contact form + automated email replies  

### Developer Experience

- Type-safe environment config (Zod) with startup validation  
- Centralized error handling and structured logging (Winston)  
- Consistent API response format  
- OpenAPI documentation at `/api-docs`  

---

## Project Structure

```
├── .env.example              # Env template (copy to .env)
├── .github/
│   ├── workflows/            # CI (ci.yml), release (release.yml)
│   └── pull_request_template.md
├── config/
│   ├── bucket-storage/       # Cloudinary setup
│   ├── cors/                 # CORS config
│   ├── database/             # Schema, migrations, seed, storage, db
│   └── swagger.ts            # OpenAPI spec
├── drizzle/                  # SQL migrations and meta
├── src/
│   ├── config/               # Env validation (Zod)
│   ├── controllers/         # Request handlers
│   ├── middlewares/          # Auth, validation, error-handler, logger, rate-limiters
│   ├── routes/               # API route definitions
│   ├── services/             # Business logic (drizzle, email)
│   ├── types/                # TypeScript declarations (e.g. express.d.ts)
│   ├── utils/                # Errors, validations, api-response
│   └── validations/          # Zod request schemas
├── tests/
│   ├── helpers/              # Mocks (Request, Response, session)
│   ├── setup.ts
│   └── unit/                 # Controllers, services, middlewares, routes, utils
├── scripts/                  # git-flow and tooling
├── index.ts                  # App entry point
├── drizzle.config.ts
├── jest.config.js
├── tsconfig.json
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── render.yaml               # Render deployment config
```

---

## Quick Start

### Prerequisites

- Node.js 20+ or 22  
- PostgreSQL (or [Neon](https://neon.tech))  
- pnpm  
- Cloudinary account (for uploads)  
- SMTP/Gmail credentials (for email)  

### Installation

```bash
# Clone the repository
git clone git@github.com:frckbrice/library-management-REST-API.git
cd library-management-REST-API

# Install dependencies
pnpm install

# Create .env (see Environment Variables below)
cp .env.example .env

# Database setup
pnpm db:push
pnpm db:seed

# Start development server
pnpm dev
```

Server runs at **http://localhost:5500**.  
Interactive API docs: **http://localhost:5500/api-docs**

### Environment Variables

```env
# Required
SESSION_SECRET=your_session_secret_min_32_chars

# Database (one of)
DATABASE_URL=postgresql://user:pass@host:5432/db
DATAAPI_URL=https://your-neon-project.neon.tech/sql  # Neon serverless

# Optional
PORT=5500
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Cloudinary (for uploads)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Email (Nodemailer)
GMAIL_USER=...
GMAIL_PASS=...
GMAIL_APP_SUPPORT=...
```

---

## API Endpoints (Summary)

| Group | Endpoints |
|-------|-----------|
| **Auth** | `POST /api/v1/auth/login`, `GET /session`, `POST /logout` |
| **Libraries** | `GET/POST/PATCH /api/v1/libraries` |
| **Stories** | `GET /api/v1/stories`, `POST/PATCH /api/v1/admin/stories` |
| **Timelines** | `GET/POST /api/v1/admin/stories/:id/timelines` |
| **Media** | `GET/POST/PATCH /api/v1/media-items` |
| **Events** | `GET/POST/PATCH/DELETE /api/v1/events` |
| **Contact** | `GET/POST /api/v1/contact-messages`, `POST /:id/reply` |
| **Super Admin** | Moderation, users, libraries |
| **Admin** | Dashboard stats, analytics, activity |
| **Health** | `GET /api/v1/health` |

Full documentation is available at `/api-docs` when the server is running.

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (nodemon + ts-node) |
| `pnpm build` | Compile TypeScript |
| `pnpm start` | Run production build |
| `pnpm check` | Type check (no emit) |
| `pnpm lint` | ESLint |
| `pnpm test` | Jest tests |
| `pnpm test:watch` | Jest watch mode |
| `pnpm db:push` | Push schema to database |
| `pnpm db:generate` | Generate migrations |
| `pnpm db:seed` | Seed database |
| `pnpm db:reset` | Reset database |

---

## Testing

- **Framework:** Jest + ts-jest  
- **Scope:** Unit tests for controllers, services, middlewares, routes, utils  
- **Helpers:** Shared mocks in `tests/helpers/mocks.ts`  

```bash
pnpm test
pnpm test -- --coverage
pnpm test:watch
```

See [tests/README.md](tests/README.md) for details.

---

## Deployment (Render)

A [Render Blueprint](render.yaml) is included for one-click deployment:

- **Build:** `pnpm install && pnpm run build`  
- **Start:** `pnpm start`  
- **Health check:** `GET /api/v1/health`  

Configure in Render Dashboard:

- `NODE_ENV=production`  
- `DATABASE_URL` or `DATAAPI_URL`  
- `SESSION_SECRET`  
- `ALLOWED_ORIGINS`  
- Cloudinary and email vars as needed  

---

## CI/CD (GitHub Actions)

The [CI workflow](.github/workflows/ci.yml) runs on push/PR to `main`, `develop`, and feature branches:

1. Type check (`pnpm check`)  
2. Lint (`pnpm lint`)  
3. Tests (`pnpm test`)  
4. Build (`pnpm build`)  
5. Security audit (`pnpm audit`)  

Matrix: Node.js 20.x and 22.x.

---

## Security

- **Helmet** — Security headers  
- **CORS** — Configurable allowed origins  
- **Rate limiting** — Tiered limits per route type  
- **Input validation** — Zod schemas on all inputs  
- **Password hashing** — bcrypt  
- **ORM** — Parameterized queries (Drizzle)  
- **Session** — Secure cookies, server-side storage  

---

## Database Schema (Main Entities)

- `users` — Auth, roles, library association  
- `libraries` — Profiles, metadata, location  
- `stories` — Rich text, tags, publish/approval  
- `media_items` — Images, video, audio; galleries  
- `timelines` — Timeline points for stories  
- `events` — Library events  
- `contact_messages` — Visitor inquiries  
- `analytics` — View/engagement tracking  
- `email_templates` — Email customization  
- `message_responses` — Reply tracking  

---

## Contributing

This is a private project. For questions or collaboration, contact the maintainers.

---

## License

MIT License.

---

**Author:** [frckbrice](https://github.com/frckbrice) — Library Management System
