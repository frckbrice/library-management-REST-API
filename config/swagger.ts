/**
 * OpenAPI 3.0 spec for Library Management API.
 * Served at /api-docs for interactive Swagger UI.
 * Does not expose internal systems, IPs, or stack traces.
 *
 * Error codes (RFC 7807–aligned): VALIDATION_ERROR, AUTHENTICATION_ERROR,
 * AUTHORIZATION_ERROR, NOT_FOUND, CONFLICT, RATE_LIMITED, INTERNAL_ERROR
 */

const apiPath = '/api/v1';
const isProduction = process.env.NODE_ENV === 'production';
// Only use public base URL; never expose localhost or internal IPs in docs
const publicBaseUrl =
  process.env.API_BASE_URL && (isProduction || process.env.API_BASE_URL.startsWith('http'))
    ? process.env.API_BASE_URL.replace(/\/$/, '')
    : null;

const servers = publicBaseUrl
  ? [{ url: publicBaseUrl, description: 'API server' }]
  : [{ url: '/', description: 'Current host (relative)' }];

/** Reusable error response with standard codes. */
const errorResponse = (description: string, exampleCode?: string, exampleMessage?: string) => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: exampleCode
        ? { success: false, error: exampleMessage || description, code: exampleCode, timestamp: new Date().toISOString() }
        : undefined,
    },
  },
});

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Library Management API',
    description: `REST API for library content management—authentication, CRUD for libraries, stories, timelines, events, media items, and contact messages. Role-based access: library admins manage their library; superadmins moderate platform-wide.

**Features:** Session-based auth, rate limiting, multipart uploads, OpenAPI docs, standardized error responses. Collections use plural nouns (e.g. \`/libraries\`, \`/stories\`, \`/events\`, \`/media-items\`, \`/contact-messages\`).`,
    version: '1.0.0',
    contact: {
      name: 'API Support',
      email: process.env.GMAIL_APP_SUPPORT || 'support@example.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers,
  tags: [
    { name: 'Auth', description: 'Login, session, logout' },
    { name: 'Libraries', description: 'Library CRUD and listing' },
    { name: 'Stories', description: 'Stories and timelines' },
    { name: 'Events', description: 'Library events' },
    { name: 'Media', description: 'Media items and galleries' },
    { name: 'Contact', description: 'Contact messages and replies' },
    { name: 'Admin', description: 'Library admin dashboard and content' },
    { name: 'Superadmin', description: 'Moderation and global admin' },
    { name: 'Settings', description: 'Platform settings' },
    { name: 'Maintenance', description: 'Health, maintenance mode, backups' },
  ],
  paths: {
    [`${apiPath}/auth/login`]: {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        description: 'Authenticate with username and password. Sets session cookie (connect.sid). Rate-limited.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login success',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginSuccessResponse' },
              },
            },
          },
          '400': errorResponse('Validation failed', 'VALIDATION_ERROR', 'Validation failed'),
          '401': errorResponse('Invalid username or password', 'AUTHENTICATION_ERROR', 'Invalid username or password'),
          '429': errorResponse('Too many login attempts. Please try again later.', 'RATE_LIMITED', 'Too many login attempts. Please try again later.'),
        },
      },
    },
    [`${apiPath}/auth/session`]: {
      get: {
        tags: ['Auth'],
        summary: 'Get current session',
        description: 'Returns the current authenticated user or null if not logged in.',
        responses: {
          '200': {
            description: 'Current user or null',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SessionResponse' },
              },
            },
          },
        },
      },
    },
    [`${apiPath}/auth/logout`]: {
      post: {
        tags: ['Auth'],
        summary: 'Logout',
        description: 'Destroys the session and clears the session cookie.',
        responses: {
          '200': {
            description: 'Logged out successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { success: { type: 'boolean', example: true }, message: { type: 'string', example: 'Logged out successfully' } },
                },
              },
            },
          },
        },
      },
    },
    [`${apiPath}/libraries`]: {
      get: {
        tags: ['Libraries'],
        summary: 'List libraries',
        description: 'Public endpoint. Returns all libraries (optionally filtered).',
        parameters: [
          { name: 'search', in: 'query', required: false, schema: { type: 'string' }, description: 'Search term' },
        ],
        responses: {
          '200': {
            description: 'List of libraries',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Library' } },
              },
            },
          },
          '500': errorResponse('Internal server error', 'INTERNAL_ERROR', 'Internal server error'),
        },
      },
      post: {
        tags: ['Libraries'],
        summary: 'Create library',
        description: 'Superadmin only. Creates a new library. New libraries require approval.',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: { $ref: '#/components/schemas/LibraryCreateForm' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Library created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessDataResponse' },
              },
            },
          },
          '401': errorResponse('Authentication required', 'AUTHENTICATION_ERROR', 'Authentication required'),
          '403': errorResponse('Insufficient permissions', 'AUTHORIZATION_ERROR', 'Insufficient permissions'),
          '400': errorResponse('Validation failed', 'VALIDATION_ERROR', 'Validation failed'),
          '500': errorResponse('Failed to upload logo or featured image', 'INTERNAL_ERROR', 'Failed to upload logo or featured image'),
        },
      },
    },
    [`${apiPath}/libraries/{id}`]: {
      get: {
        tags: ['Libraries'],
        summary: 'Get library by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'Library',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Library' },
              },
            },
          },
          '404': errorResponse('Library not found', 'NOT_FOUND', 'Library not found'),
          '500': errorResponse('Internal server error'),
        },
      },
      patch: {
        tags: ['Libraries'],
        summary: 'Update library',
        description: 'Library admin only. Can only edit own library.',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: { $ref: '#/components/schemas/LibraryUpdateForm' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated library',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessDataResponse' },
              },
            },
          },
          '401': errorResponse('Authentication required', 'AUTHENTICATION_ERROR', 'Authentication required'),
          '403': errorResponse('You can only edit your own library', 'AUTHORIZATION_ERROR', 'You can only edit your own library'),
          '404': errorResponse('Library not found', 'NOT_FOUND', 'Library not found'),
          '500': errorResponse('Failed to upload image'),
        },
      },
      delete: {
        tags: ['Libraries'],
        summary: 'Delete library',
        description: 'Superadmin only. Permanently deletes a library. Unassigns linked users; stories, events, media, and contact messages for this library are removed (cascade).',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '204': { description: 'Library deleted successfully' },
          '401': errorResponse('Authentication required', 'AUTHENTICATION_ERROR', 'Authentication required'),
          '403': errorResponse('Insufficient permissions', 'AUTHORIZATION_ERROR', 'Insufficient permissions'),
          '404': errorResponse('Library not found', 'NOT_FOUND', 'Library not found'),
          '500': errorResponse('Internal server error', 'INTERNAL_ERROR', 'Internal server error'),
        },
      },
    },
    [`${apiPath}/stories`]: {
      get: {
        tags: ['Stories'],
        summary: 'List stories',
        description: 'Public endpoint. Supports filtering by library, published, approved, featured, tags, pagination.',
        parameters: [
          { name: 'libraryId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'published', in: 'query', schema: { type: 'string', enum: ['true', 'false'] }, description: 'Filter by published status' },
          { name: 'approved', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
          { name: 'featured', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
          { name: 'tag', in: 'query', schema: { type: 'string' }, description: 'Filter by tag (can repeat)' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
        ],
        responses: {
          '200': {
            description: 'List of stories',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Story' } },
              },
            },
          },
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/stories/tags`]: {
      get: {
        tags: ['Stories'],
        summary: 'List story tags',
        description: 'Returns all unique tags from published, approved stories.',
        responses: {
          '200': {
            description: 'Sorted array of tag strings',
            content: {
              'application/json': {
                schema: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/stories/{id}`]: {
      get: {
        tags: ['Stories'],
        summary: 'Get story by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'Story',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StorySuccessResponse' },
              },
            },
          },
          '404': errorResponse('Story not found', 'NOT_FOUND', 'Story not found'),
          '500': errorResponse('Internal server error', 'INTERNAL_ERROR', 'Internal server error'),
        },
      },
    },
    [`${apiPath}/admin/stories`]: {
      post: {
        tags: ['Stories'],
        summary: 'Create story',
        description: 'Library admin. Creates story for own library. New stories require superadmin approval.',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: { $ref: '#/components/schemas/StoryCreateForm' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Story created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessDataResponse' },
              },
            },
          },
          '401': errorResponse('Authentication required'),
          '400': errorResponse('Validation failed'),
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/admin/stories/{id}`]: {
      delete: {
        tags: ['Stories'],
        summary: 'Delete story',
        description: 'Library admin. Permanently deletes a story. Can only delete stories for own library.',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '204': { description: 'Story deleted successfully' },
          '401': errorResponse('Authentication required', 'AUTHENTICATION_ERROR', 'Authentication required'),
          '403': errorResponse('You can only delete stories for your library', 'AUTHORIZATION_ERROR', 'You can only delete stories for your library'),
          '404': errorResponse('Story not found', 'NOT_FOUND', 'Story not found'),
          '500': errorResponse('Internal server error', 'INTERNAL_ERROR', 'Internal server error'),
        },
      },
      get: {
        tags: ['Stories'],
        summary: 'Get story (admin)',
        description: 'For editing. Library admins can only access stories in their library.',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'Story',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StorySuccessResponse' },
              },
            },
          },
          '401': errorResponse('Authentication required', 'AUTHENTICATION_ERROR', 'Authentication required'),
          '403': errorResponse('You can only access stories in your library', 'AUTHORIZATION_ERROR', 'You can only access stories in your library'),
          '404': errorResponse('Story not found', 'NOT_FOUND', 'Story not found'),
          '500': errorResponse('Internal server error', 'INTERNAL_ERROR', 'Internal server error'),
        },
      },
      patch: {
        tags: ['Stories'],
        summary: 'Update story',
        description: 'Library admin. Can only edit stories for own library. Approval status is preserved (superadmin only).',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: { $ref: '#/components/schemas/StoryUpdateForm' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated story',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessDataResponse' },
              },
            },
          },
          '401': errorResponse('Authentication required'),
          '403': errorResponse('You can only edit stories for your library'),
          '404': errorResponse('Story not found'),
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/admin/stories/{id}/timelines`]: {
      get: {
        tags: ['Stories'],
        summary: 'Get timelines for story',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'List of timelines',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Timeline' } },
              },
            },
          },
          '401': errorResponse('Authentication required'),
          '403': errorResponse('You can only access timelines for stories in your library'),
          '404': errorResponse('Story not found'),
          '500': errorResponse('Internal server error'),
        },
      },
      post: {
        tags: ['Stories'],
        summary: 'Create timeline for story',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TimelineCreate' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Timeline created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Timeline' },
              },
            },
          },
          '401': errorResponse('Authentication required'),
          '403': errorResponse('You can only add timelines to stories in your library'),
          '404': errorResponse('Story not found'),
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/events`]: {
      get: {
        tags: ['Events'],
        summary: 'List events',
        description: 'Returns events. When authenticated, filters by library; otherwise all.',
        parameters: [
          { name: 'libraryId', in: 'query', schema: { type: 'string', format: 'uuid' }, description: 'Filter by library' },
        ],
        responses: {
          '200': {
            description: 'List of events',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Event' } },
              },
            },
          },
          '500': errorResponse('Internal server error'),
        },
      },
      post: {
        tags: ['Events'],
        summary: 'Create event',
        description: 'Library admin. Creates event for own library. New events require approval.',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: { $ref: '#/components/schemas/EventCreateForm' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Event created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Event' },
              },
            },
          },
          '400': errorResponse('Library ID required', 'VALIDATION_ERROR', 'Library ID required'),
          '401': errorResponse('Authentication required', 'AUTHENTICATION_ERROR', 'Authentication required'),
          '500': errorResponse('Failed to upload event image', 'INTERNAL_ERROR', 'Failed to upload event image'),
        },
      },
    },
    [`${apiPath}/events/{id}`]: {
      get: {
        tags: ['Events'],
        summary: 'Get event by ID',
        description: 'Returns a single event by ID. Public endpoint.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'Event',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Event' },
              },
            },
          },
          '404': errorResponse('Event not found', 'NOT_FOUND', 'Event not found'),
          '500': errorResponse('Internal server error', 'INTERNAL_ERROR', 'Internal server error'),
        },
      },
      patch: {
        tags: ['Events'],
        summary: 'Update event',
        description: 'Library admin. Can only edit events for own library.',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: { $ref: '#/components/schemas/EventUpdateForm' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated event',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Event' },
              },
            },
          },
          '401': errorResponse('Authentication required'),
          '403': errorResponse('Unauthorized - you can only edit events for your library'),
          '404': errorResponse('Event not found'),
          '500': errorResponse('Failed to upload event image'),
        },
      },
      delete: {
        tags: ['Events'],
        summary: 'Delete event',
        description: 'Library admin. Can only delete events for own library.',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '204': { description: 'Event deleted successfully' },
          '401': errorResponse('Authentication required', 'AUTHENTICATION_ERROR', 'Authentication required'),
          '403': errorResponse('You can only delete events for your library', 'AUTHORIZATION_ERROR', 'You can only delete events for your library'),
          '404': errorResponse('Event not found', 'NOT_FOUND', 'Event not found'),
          '500': errorResponse('Internal server error', 'INTERNAL_ERROR', 'Internal server error'),
        },
      },
    },
    [`${apiPath}/media-items`]: {
      get: {
        tags: ['Media'],
        summary: 'List media items',
        parameters: [
          { name: 'libraryId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'galleryId', in: 'query', schema: { type: 'string' } },
          { name: 'approved', in: 'query', schema: { type: 'string', enum: ['true', 'false'] }, default: 'true' },
          { name: 'mediaType', in: 'query', schema: { type: 'string', enum: ['image', 'video', 'audio'] } },
          { name: 'tag', in: 'query', schema: { type: 'string' }, description: 'Filter by tag (can repeat)' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
        ],
        responses: {
          '200': {
            description: 'List of media items',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/MediaItem' } },
              },
            },
          },
          '500': errorResponse('Internal server error'),
        },
      },
      post: {
        tags: ['Media'],
        summary: 'Upload media',
        description: 'Library admin. Requires mediaFile or url. New media requires approval.',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: { $ref: '#/components/schemas/MediaCreateForm' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Media created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MediaItem' },
              },
            },
          },
          '400': errorResponse('Media URL or file is required, or Library ID required'),
          '401': errorResponse('Authentication required'),
          '403': errorResponse('Unauthorized - not logged in'),
          '500': errorResponse('Failed to upload media file'),
        },
      },
    },
    [`${apiPath}/media-items/{id}`]: {
      get: {
        tags: ['Media'],
        summary: 'Get media by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'Media item',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MediaItem' },
              },
            },
          },
          '404': errorResponse('Media item not found'),
          '500': errorResponse('Internal server error'),
        },
      },
      patch: {
        tags: ['Media'],
        summary: 'Update media',
        description: 'Library admin. Can only edit media for own library.',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: { $ref: '#/components/schemas/MediaUpdateForm' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated media',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MediaItem' },
              },
            },
          },
          '401': errorResponse('Authentication required', 'AUTHENTICATION_ERROR', 'Authentication required'),
          '403': errorResponse('Unauthorized - you can only edit media for your library', 'AUTHORIZATION_ERROR', 'Unauthorized - you can only edit media for your library'),
          '404': errorResponse('Media item not found', 'NOT_FOUND', 'Media item not found'),
          '500': errorResponse('Failed to upload media file', 'INTERNAL_ERROR', 'Failed to upload media file'),
        },
      },
      delete: {
        tags: ['Media'],
        summary: 'Delete media item',
        description: 'Library admin. Permanently deletes a media item. Can only delete media for own library.',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '204': { description: 'Media item deleted successfully' },
          '401': errorResponse('Authentication required', 'AUTHENTICATION_ERROR', 'Authentication required'),
          '403': errorResponse('Unauthorized - you can only delete media for your library', 'AUTHORIZATION_ERROR', 'Unauthorized - you can only delete media for your library'),
          '404': errorResponse('Media item not found', 'NOT_FOUND', 'Media item not found'),
          '500': errorResponse('Internal server error', 'INTERNAL_ERROR', 'Internal server error'),
        },
      },
    },
    [`${apiPath}/admin/media/tags`]: {
      get: {
        tags: ['Media'],
        summary: 'List media tags',
        description: 'Returns all unique media tags. Requires authentication.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Sorted array of tag strings',
            content: {
              'application/json': {
                schema: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          '403': errorResponse('Unauthorized - not logged in'),
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/admin/upload/image/{publicId}`]: {
      delete: {
        tags: ['Admin'],
        summary: 'Delete image from Cloudinary',
        description: 'Deletes an image by its Cloudinary public ID.',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'publicId', in: 'path', required: true, schema: { type: 'string' }, description: 'Cloudinary public ID (may be URL-encoded)' }],
        responses: {
          '200': {
            description: 'Image deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { success: { type: 'boolean' }, message: { type: 'string' } },
                },
              },
            },
          },
          '401': errorResponse('Authentication required'),
          '404': errorResponse('Image not found or already deleted'),
          '500': errorResponse('Failed to delete image'),
          '503': errorResponse('Cloudinary not configured'),
        },
      },
    },
    [`${apiPath}/contact-messages`]: {
      get: {
        tags: ['Contact'],
        summary: 'List contact messages',
        description: 'Library admin only. Returns messages for own library.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'List of contact messages',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/ContactMessage' } },
              },
            },
          },
          '401': errorResponse('Authentication required'),
          '500': errorResponse('Internal server error'),
        },
      },
      post: {
        tags: ['Contact'],
        summary: 'Submit contact message',
        description: 'Public. Rate-limited. Creates a new contact message for a library.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ContactMessageCreate' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Message created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ContactMessage' },
              },
            },
          },
          '400': errorResponse('Validation failed'),
          '429': errorResponse('Too many contact submissions', 'RATE_LIMITED', 'Too many contact submissions. Please try again later.'),
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/contact-messages/{id}`]: {
      get: {
        tags: ['Contact'],
        summary: 'Get contact message by ID',
        description: 'Library admin only. Returns a single contact message for own library.',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'Contact message',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ContactMessage' },
              },
            },
          },
          '401': errorResponse('Authentication required', 'AUTHENTICATION_ERROR', 'Authentication required'),
          '403': errorResponse('Insufficient permissions', 'AUTHORIZATION_ERROR', 'Insufficient permissions'),
          '404': errorResponse('Contact message not found', 'NOT_FOUND', 'Contact message not found'),
          '500': errorResponse('Internal server error', 'INTERNAL_ERROR', 'Internal server error'),
        },
      },
      patch: {
        tags: ['Contact'],
        summary: 'Update contact message',
        description: 'Library admin. Update status, isRead, etc.',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  isRead: { type: 'boolean' },
                  responseStatus: { type: 'string', enum: ['pending', 'responded', 'closed'] },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated message',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ContactMessage' },
              },
            },
          },
          '401': errorResponse('Authentication required', 'AUTHENTICATION_ERROR', 'Authentication required'),
          '403': errorResponse('Insufficient permissions', 'AUTHORIZATION_ERROR', 'Insufficient permissions'),
          '404': errorResponse('Contact message not found', 'NOT_FOUND', 'Contact message not found'),
          '500': errorResponse('Internal server error', 'INTERNAL_ERROR', 'Internal server error'),
        },
      },
      delete: {
        tags: ['Contact'],
        summary: 'Delete contact message',
        description: 'Library admin only. Permanently deletes a contact message for own library.',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '204': { description: 'Contact message deleted successfully' },
          '401': errorResponse('Authentication required', 'AUTHENTICATION_ERROR', 'Authentication required'),
          '403': errorResponse('Insufficient permissions', 'AUTHORIZATION_ERROR', 'Insufficient permissions'),
          '404': errorResponse('Contact message not found', 'NOT_FOUND', 'Contact message not found'),
          '500': errorResponse('Internal server error', 'INTERNAL_ERROR', 'Internal server error'),
        },
      },
    },
    [`${apiPath}/contact-messages/{id}/reply`]: {
      post: {
        tags: ['Contact'],
        summary: 'Reply to contact message',
        description: 'Library admin. Sends email to visitor and records response. Rate-limited for email.',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ContactReplyRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Reply sent',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
          '400': errorResponse('Subject and message are required', 'VALIDATION_ERROR', 'Subject and message are required'),
          '401': errorResponse('Unauthorized', 'AUTHENTICATION_ERROR', 'Unauthorized'),
          '404': errorResponse('Message not found', 'NOT_FOUND', 'Message not found'),
          '500': errorResponse('Failed to send email response', 'INTERNAL_ERROR', 'Failed to send email response'),
          '429': errorResponse('Email rate limit exceeded', 'RATE_LIMITED', 'Email rate limit exceeded. Please try again later.'),
        },
      },
    },
    [`${apiPath}/admin/dashboard/stats`]: {
      get: {
        tags: ['Admin'],
        summary: 'Dashboard stats',
        description: 'Library admin. Returns counts for stories, media, events, messages.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Stats object',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DashboardStats' },
              },
            },
          },
          '400': errorResponse('Library ID required'),
          '401': errorResponse('Authentication required'),
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/admin/dashboard/analytics`]: {
      get: {
        tags: ['Admin'],
        summary: 'Dashboard analytics',
        description: 'Library admin. Returns visitor, content, engagement, and top performers data.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Analytics object',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DashboardAnalytics' },
              },
            },
          },
          '400': errorResponse('Library ID required'),
          '401': errorResponse('Authentication required'),
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/admin/dashboard/activity`]: {
      get: {
        tags: ['Admin'],
        summary: 'Recent activity',
        description: 'Library admin. Returns recent stories, messages, events.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Recent activity array',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['story', 'message', 'event'] },
                      title: { type: 'string' },
                      timestamp: { type: 'string', format: 'date-time' },
                      status: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
          '400': errorResponse('Library ID required'),
          '401': errorResponse('Authentication required'),
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/admin/galleries`]: {
      get: {
        tags: ['Admin'],
        summary: 'List galleries',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'List of galleries',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Gallery' } },
              },
            },
          },
          '403': errorResponse('Unauthorized - not logged in'),
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/sadmin/stats`]: {
      get: {
        tags: ['Superadmin'],
        summary: 'Superadmin stats',
        description: 'Platform-wide stats: libraries, stories, media, users, recent activity.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Stats object',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuperadminStats' },
              },
            },
          },
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/superadmin/moderation/stories`]: {
      get: {
        tags: ['Superadmin'],
        summary: 'Stories pending moderation',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'List of pending stories',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Story' } },
              },
            },
          },
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/superadmin/moderation/media`]: {
      get: {
        tags: ['Superadmin'],
        summary: 'Media pending moderation',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'List of pending media items',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/MediaItem' } },
              },
            },
          },
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/superadmin/stories/{id}/approve`]: {
      patch: {
        tags: ['Superadmin'],
        summary: 'Approve story',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'Story approved',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Story' },
              },
            },
          },
          '404': errorResponse('Story not found'),
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/superadmin/stories/{id}/reject`]: {
      patch: {
        tags: ['Superadmin'],
        summary: 'Reject story',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'Story rejected',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Story' },
              },
            },
          },
          '404': errorResponse('Story not found'),
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/superadmin/media-items/{id}/approve`]: {
      patch: {
        tags: ['Superadmin'],
        summary: 'Approve media item',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'Media approved',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MediaItem' },
              },
            },
          },
          '404': errorResponse('Media item not found'),
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/superadmin/media-items/{id}/reject`]: {
      patch: {
        tags: ['Superadmin'],
        summary: 'Reject media item',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'Media rejected',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MediaItem' },
              },
            },
          },
          '404': errorResponse('Media item not found'),
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/superadmin/libraries`]: {
      get: {
        tags: ['Superadmin'],
        summary: 'List all libraries',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'List of libraries',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Library' } },
              },
            },
          },
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/superadmin/users`]: {
      get: {
        tags: ['Superadmin'],
        summary: 'List users',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'List of users (across all libraries)',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/User' } },
              },
            },
          },
          '500': errorResponse('Internal server error'),
        },
      },
      post: {
        tags: ['Superadmin'],
        summary: 'Create user',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserCreate' },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          '400': errorResponse('Missing required fields'),
          '409': errorResponse('Username or email already in use', 'CONFLICT', 'Username already in use. Please choose a different one.'),
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/superadmin/users/{id}`]: {
      patch: {
        tags: ['Superadmin'],
        summary: 'Update user',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserUpdate' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated user',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          '404': errorResponse('User not found'),
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/superadmin/users/{id}/reset-password`]: {
      post: {
        tags: ['Superadmin'],
        summary: 'Reset user password',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['password'],
                properties: {
                  password: { type: 'string', minLength: 8, description: 'New password (min 8 characters)' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Password reset successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { message: { type: 'string', example: 'Password reset successfully' } },
                },
              },
            },
          },
          '400': errorResponse('Password is required'),
          '404': errorResponse('User not found'),
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/settings`]: {
      get: {
        tags: ['Settings'],
        summary: 'Get platform settings',
        description: 'Returns general, security, email, content, appearance, notifications settings.',
        responses: {
          '200': {
            description: 'Platform settings object',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PlatformSettings' },
              },
            },
          },
          '500': errorResponse('Internal server error'),
        },
      },
      post: {
        tags: ['Settings'],
        summary: 'Update platform settings',
        description: 'Merges provided updates with existing settings (in-memory; prefer DB in production).',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: 'Partial platform settings to merge',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated settings',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PlatformSettings' },
              },
            },
          },
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/settings/test-email`]: {
      post: {
        tags: ['Settings'],
        summary: 'Test email configuration',
        description: 'Sends a test email to verify SMTP/email setup.',
        responses: {
          '200': {
            description: 'Test email sent',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { message: { type: 'string', example: 'Test email sent successfully' } },
                },
              },
            },
          },
          '500': errorResponse('Failed to send test email'),
        },
      },
    },
    [`${apiPath}/health`]: {
      get: {
        tags: ['Maintenance'],
        summary: 'Health check',
        description: 'Verifies database connectivity. Returns system healthy/unhealthy.',
        responses: {
          '200': {
            description: 'System healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'system healthy' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '500': {
            description: 'System unhealthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'system unhealthy' },
                    error: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    [`${apiPath}/maintenance/status`]: {
      get: {
        tags: ['Maintenance'],
        summary: 'Maintenance status',
        description: 'Returns maintenance mode, system health, metrics, windows, backup history.',
        responses: {
          '200': {
            description: 'Maintenance status',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MaintenanceStatus' },
              },
            },
          },
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/maintenance/toggle`]: {
      post: {
        tags: ['Maintenance'],
        summary: 'Toggle maintenance mode',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['enabled'],
                properties: {
                  enabled: { type: 'boolean', description: 'Enable or disable maintenance mode' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Maintenance mode toggled',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    maintenanceMode: { type: 'boolean' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/maintenance/schedule`]: {
      post: {
        tags: ['Maintenance'],
        summary: 'Schedule maintenance window',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'scheduledStart'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  scheduledStart: { type: 'string', format: 'date-time' },
                  scheduledEnd: { type: 'string', format: 'date-time' },
                  affectedServices: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Maintenance window scheduled',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    scheduledStart: { type: 'string', format: 'date-time' },
                    scheduledEnd: { type: 'string', format: 'date-time', nullable: true },
                    affectedServices: { type: 'array', items: { type: 'string' } },
                    status: { type: 'string', default: 'scheduled' },
                    createdAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '400': errorResponse('Title and start time are required'),
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/maintenance/backup`]: {
      post: {
        tags: ['Maintenance'],
        summary: 'Create backup',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type'],
                properties: {
                  type: { type: 'string', enum: ['database', 'files', 'full'], description: 'Backup type' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Backup started',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    type: { type: 'string', enum: ['database', 'files', 'full'] },
                    size: { type: 'string' },
                    created: { type: 'string', format: 'date-time' },
                    status: { type: 'string', default: 'running' },
                  },
                },
              },
            },
          },
          '400': errorResponse('Invalid backup type'),
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/maintenance/backups`]: {
      get: {
        tags: ['Maintenance'],
        summary: 'List backup history',
        responses: {
          '200': {
            description: 'Backup history',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      type: { type: 'string' },
                      size: { type: 'string' },
                      created: { type: 'string', format: 'date-time' },
                      status: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
          '500': errorResponse('Internal server error'),
        },
      },
    },
    [`${apiPath}/maintenance/refresh`]: {
      post: {
        tags: ['Maintenance'],
        summary: 'Refresh system status',
        description: 'Re-checks system health for all services.',
        responses: {
          '200': {
            description: 'Updated system health',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    systemHealth: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          service: { type: 'string' },
                          status: { type: 'string', enum: ['healthy', 'warning', 'unhealthy'] },
                          uptime: { type: 'string' },
                          responseTime: { type: 'integer' },
                          lastCheck: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '500': errorResponse('Internal server error'),
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'connect.sid',
        description: 'Session cookie set after login. Required for authenticated endpoints.',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        required: ['success', 'error', 'timestamp'],
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', description: 'Human-readable error message' },
          code: {
            type: 'string',
            enum: ['VALIDATION_ERROR', 'AUTHENTICATION_ERROR', 'AUTHORIZATION_ERROR', 'NOT_FOUND', 'CONFLICT', 'RATE_LIMITED', 'INTERNAL_ERROR'],
            description: 'Machine-readable error code for client handling',
          },
          errors: {
            type: 'object',
            additionalProperties: { type: 'array', items: { type: 'string' } },
            description: 'Field-level validation errors (when code is VALIDATION_ERROR)',
          },
          timestamp: { type: 'string', format: 'date-time', description: 'ISO 8601 timestamp' },
        },
      },
      ValidationErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Validation failed' },
          errors: {
            type: 'object',
            additionalProperties: { type: 'array', items: { type: 'string' } },
          },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', minLength: 3, example: 'admin', description: 'Username (min 3 characters)' },
          password: { type: 'string', format: 'password', minLength: 6, description: 'Password (min 6 characters)' },
        },
      },
      LoginSuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              username: { type: 'string' },
              fullName: { type: 'string' },
              email: { type: 'string', format: 'email' },
              role: { type: 'string', enum: ['library_admin', 'super_admin'] },
              libraryId: { type: 'string', format: 'uuid', nullable: true },
            },
          },
        },
      },
      SessionResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            oneOf: [
              {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  username: { type: 'string' },
                  fullName: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string' },
                  libraryId: { type: 'string' },
                },
              },
              { type: 'object', nullable: true },
            ],
            description: 'Current user object or null if not logged in',
          },
        },
      },
      SuccessDataResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object', description: 'The created/updated resource' },
        },
      },
      Library: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string' },
          location: { type: 'string' },
          city: { type: 'string' },
          country: { type: 'string' },
          logoUrl: { type: 'string', format: 'uri', nullable: true },
          featuredImageUrl: { type: 'string', format: 'uri', nullable: true },
          website: { type: 'string', format: 'uri', nullable: true },
          isApproved: { type: 'boolean', default: false },
          isActive: { type: 'boolean', default: true },
          isFeatured: { type: 'boolean', default: false },
          libraryType: { type: 'string', enum: ['public', 'academic', 'special'] },
          coordinates: { type: 'object', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      LibraryCreateForm: {
        type: 'object',
        properties: {
          name: { type: 'string', required: true },
          description: { type: 'string' },
          location: { type: 'string' },
          city: { type: 'string' },
          country: { type: 'string' },
          libraryType: { type: 'string' },
          website: { type: 'string' },
          logo: { type: 'string', format: 'binary', description: 'Logo image file' },
          featuredImage: { type: 'string', format: 'binary', description: 'Featured image file' },
          logoUrl: { type: 'string', description: 'Or provide URL instead of file' },
          featuredImageUrl: { type: 'string' },
          coordinates: { type: 'object' },
        },
      },
      LibraryUpdateForm: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          location: { type: 'string' },
          city: { type: 'string' },
          country: { type: 'string' },
          libraryType: { type: 'string' },
          website: { type: 'string' },
          logo: { type: 'string', format: 'binary' },
          featuredImage: { type: 'string', format: 'binary' },
          logoUrl: { type: 'string' },
          featuredImageUrl: { type: 'string' },
          coordinates: { type: 'object' },
        },
      },
      Story: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          libraryId: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          content: { type: 'string', description: 'Rich text (HTML)' },
          summary: { type: 'string' },
          featuredImageUrl: { type: 'string', format: 'uri', nullable: true },
          isPublished: { type: 'boolean', default: false },
          isApproved: { type: 'boolean', default: false },
          isFeatured: { type: 'boolean', default: false },
          tags: { type: 'array', items: { type: 'string' } },
          publishedAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      StorySuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { $ref: '#/components/schemas/Story' },
        },
      },
      StoryCreateForm: {
        type: 'object',
        properties: {
          title: { type: 'string', required: true },
          content: { type: 'string', required: true },
          summary: { type: 'string' },
          libraryId: { type: 'string', format: 'uuid' },
          featuredImage: { type: 'string', format: 'binary' },
          featuredImageUrl: { type: 'string' },
          isPublished: { type: 'boolean', default: false },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
      StoryUpdateForm: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          summary: { type: 'string' },
          featuredImage: { type: 'string', format: 'binary' },
          featuredImageUrl: { type: 'string' },
          isPublished: { type: 'boolean' },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
      Timeline: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          storyId: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          timelinePoints: { type: 'array', description: 'Array of timeline point objects' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      TimelineCreate: {
        type: 'object',
        required: ['title', 'timelinePoints'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          timelinePoints: { type: 'array' },
        },
      },
      Event: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          libraryId: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          eventDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time', nullable: true },
          location: { type: 'string' },
          imageUrl: { type: 'string', format: 'uri', nullable: true },
          isPublished: { type: 'boolean', default: false },
          isApproved: { type: 'boolean', default: false },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      EventCreateForm: {
        type: 'object',
        properties: {
          title: { type: 'string', required: true },
          description: { type: 'string', required: true },
          eventDate: { type: 'string', format: 'date-time', required: true },
          endDate: { type: 'string', format: 'date-time' },
          location: { type: 'string', required: true },
          eventImage: { type: 'string', format: 'binary' },
          imageUrl: { type: 'string' },
        },
      },
      EventUpdateForm: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          eventDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          location: { type: 'string' },
          eventImage: { type: 'string', format: 'binary' },
          imageUrl: { type: 'string' },
          isPublished: { type: 'boolean' },
        },
      },
      MediaItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          libraryId: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          mediaType: { type: 'string', enum: ['image', 'video', 'audio'] },
          url: { type: 'string', format: 'uri' },
          galleryId: { type: 'string', nullable: true },
          tags: { type: 'array', items: { type: 'string' } },
          isApproved: { type: 'boolean', default: false },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      MediaCreateForm: {
        type: 'object',
        properties: {
          title: { type: 'string', required: true },
          description: { type: 'string' },
          mediaType: { type: 'string', enum: ['image', 'video', 'audio'], required: true },
          mediaFile: { type: 'string', format: 'binary', description: 'File upload' },
          url: { type: 'string', description: 'Or provide URL if no file' },
          galleryId: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
      MediaUpdateForm: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          mediaType: { type: 'string', enum: ['image', 'video', 'audio'] },
          mediaFile: { type: 'string', format: 'binary' },
          url: { type: 'string' },
          galleryId: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
      Gallery: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          libraryId: { type: 'string' },
          mediaCount: { type: 'integer' },
        },
      },
      ContactMessage: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          libraryId: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          subject: { type: 'string' },
          message: { type: 'string' },
          isRead: { type: 'boolean', default: false },
          responseStatus: { type: 'string', enum: ['pending', 'responded', 'closed'], default: 'pending' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ContactMessageCreate: {
        type: 'object',
        required: ['name', 'email', 'subject', 'message', 'libraryId'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          email: { type: 'string', format: 'email' },
          subject: { type: 'string', minLength: 1, maxLength: 200 },
          message: { type: 'string', minLength: 1, maxLength: 5000 },
          libraryId: { type: 'string', format: 'uuid' },
        },
      },
      ContactReplyRequest: {
        type: 'object',
        required: ['subject', 'message'],
        properties: {
          subject: { type: 'string', minLength: 1, maxLength: 200 },
          message: { type: 'string', minLength: 1, maxLength: 5000 },
        },
      },
      MessageResponse: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          contactMessageId: { type: 'string', format: 'uuid' },
          respondedBy: { type: 'string', format: 'uuid' },
          subject: { type: 'string' },
          message: { type: 'string' },
          emailSent: { type: 'boolean', default: false },
          emailSentAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      DashboardStats: {
        type: 'object',
        properties: {
          totalStories: { type: 'integer' },
          publishedStories: { type: 'integer' },
          totalMedia: { type: 'integer' },
          approvedMedia: { type: 'integer' },
          totalEvents: { type: 'integer' },
          upcomingEvents: { type: 'integer' },
          totalMessages: { type: 'integer' },
          unreadMessages: { type: 'integer' },
        },
      },
      DashboardAnalytics: {
        type: 'object',
        properties: {
          visitorData: { type: 'array' },
          contentData: { type: 'array' },
          engagementData: { type: 'array' },
          topPerformers: { type: 'object' },
        },
      },
      SuperadminStats: {
        type: 'object',
        properties: {
          totalLibraries: { type: 'integer' },
          pendingLibraries: { type: 'integer' },
          totalStories: { type: 'integer' },
          pendingStories: { type: 'integer' },
          totalMedia: { type: 'integer' },
          uniqueGalleries: { type: 'integer' },
          totalUsers: { type: 'integer' },
          activeUsers: { type: 'integer' },
          recentActivity: { type: 'array' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          username: { type: 'string' },
          email: { type: 'string', format: 'email' },
          fullName: { type: 'string' },
          role: { type: 'string', enum: ['library_admin', 'super_admin'] },
          libraryId: { type: 'string', format: 'uuid', nullable: true },
          isActive: { type: 'boolean', default: true },
          lastLoginAt: { type: 'string', format: 'date-time' },
        },
      },
      UserCreate: {
        type: 'object',
        required: ['username', 'password', 'email', 'fullName', 'role'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 50 },
          password: { type: 'string', minLength: 8, format: 'password' },
          email: { type: 'string', format: 'email' },
          fullName: { type: 'string', minLength: 1, maxLength: 100 },
          role: { type: 'string', enum: ['library_admin', 'super_admin'] },
          libraryId: { type: 'string', format: 'uuid', nullable: true },
          isActive: { type: 'boolean', default: true },
        },
      },
      UserUpdate: {
        type: 'object',
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 50 },
          email: { type: 'string', format: 'email' },
          fullName: { type: 'string', minLength: 1, maxLength: 100 },
          role: { type: 'string', enum: ['library_admin', 'super_admin'] },
          libraryId: { type: 'string', format: 'uuid', nullable: true },
          isActive: { type: 'boolean' },
        },
      },
      PlatformSettings: {
        type: 'object',
        properties: {
          general: {
            type: 'object',
            properties: {
              siteName: { type: 'string', default: 'Library Digital Platform' },
              siteDescription: { type: 'string' },
              contactEmail: { type: 'string' },
              supportEmail: { type: 'string' },
              defaultLanguage: { type: 'string', default: 'en' },
              timezone: { type: 'string', default: 'UTC' },
              allowRegistration: { type: 'boolean', default: true },
              maintenanceMode: { type: 'boolean', default: false },
            },
          },
          security: {
            type: 'object',
            properties: {
              passwordMinLength: { type: 'integer', default: 8 },
              sessionTimeout: { type: 'integer', default: 24 },
              maxLoginAttempts: { type: 'integer', default: 5 },
            },
          },
          email: { type: 'object' },
          content: { type: 'object' },
          appearance: { type: 'object' },
          notifications: { type: 'object' },
        },
      },
      MaintenanceStatus: {
        type: 'object',
        properties: {
          maintenanceMode: { type: 'boolean' },
          systemHealth: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                service: { type: 'string' },
                status: { type: 'string', enum: ['healthy', 'warning', 'unhealthy'] },
                uptime: { type: 'string' },
                responseTime: { type: 'integer' },
                lastCheck: { type: 'string', format: 'date-time' },
              },
            },
          },
          systemMetrics: {
            type: 'object',
            properties: {
              cpuUsage: { type: 'integer' },
              memoryUsage: { type: 'integer' },
              diskUsage: { type: 'integer' },
              networkTraffic: { type: 'string' },
            },
          },
          maintenanceWindows: { type: 'array' },
          backupHistory: { type: 'array' },
        },
      },
    },
  },
};
