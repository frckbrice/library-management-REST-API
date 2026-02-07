/**
 * Centralized API response formatting (DRY).
 * All error and success responses should use these helpers so clients get a
 * consistent shape and no sensitive or system-internal information is leaked.
 *
 * @module src/utils/api-response
 */

/** Error codes returned to clients (machine-readable). Do not expose internal system names. */
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/** Standard error response body for all API errors. */
export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: ErrorCodeType;
  errors?: Record<string, string[]>;
  timestamp: string;
}

/** Standard success response body (optional; many endpoints return data directly). */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
  timestamp: string;
}

/** Patterns that may leak internal systems (DB, runtime, IPs). Never sent to client in production. */
const SENSITIVE_PATTERNS = [
  /\b(?:postgres|postgresql|mysql|mongodb|redis|drizzle|knex|prisma|sequelize)\b/i,
  /\b(?:ECONNREFUSED|ETIMEDOUT|ENOTFOUND|ECONNRESET)\b/,
  /\b(?:node\.js|express|connect\.sid)\b/i,
  /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?/, // IPv4 with optional port
  /\[::?\d*\](?::\d+)?/, // IPv6
  /localhost(?::\d+)?/i,
  /\/var\/|\/usr\/|\/home\//,
];

/**
 * Sanitizes a message so it is safe to return to the client.
 * In production, replaces or strips anything that could reveal stack traces,
 * internal systems, or network details.
 */
export function sanitizeErrorMessage(
  message: string,
  isProduction: boolean
): string {
  if (!message || typeof message !== 'string') {
    return 'An unexpected error occurred. Please try again later.';
  }
  if (!isProduction) {
    return message;
  }
  const trimmed = message.trim();
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return 'An unexpected error occurred. Please try again or contact support.';
    }
  }
  // Allow short, generic messages; otherwise replace with generic text
  if (trimmed.length > 200) {
    return 'An unexpected error occurred. Please try again or contact support.';
  }
  return trimmed;
}

/**
 * Builds a single error response object. Use this everywhere (error handler,
 * rate limiters, and any route that sends an error JSON).
 */
export function formatErrorResponse(options: {
  statusCode: number;
  error: string;
  code?: ErrorCodeType;
  errors?: Record<string, string[]>;
  isProduction: boolean;
  /** Raw message only used in development for debugging; sanitized in production. */
  rawMessage?: string;
}): { statusCode: number; body: ApiErrorResponse } {
  const {
    statusCode,
    error,
    code,
    errors,
    isProduction,
    rawMessage,
  } = options;
  const safeError = isProduction
    ? sanitizeErrorMessage(error, true)
    : (rawMessage ?? error);
  const body: ApiErrorResponse = {
    success: false,
    error: safeError,
    timestamp: new Date().toISOString(),
  };
  if (code) body.code = code;
  if (errors && Object.keys(errors).length > 0) body.errors = errors;
  return { statusCode, body };
}

/**
 * Builds a standard success response (optional use for consistency).
 */
export function formatSuccessResponse<T>(payload: {
  data?: T;
  message?: string;
}): ApiSuccessResponse<T> {
  return {
    success: true,
    ...payload,
    timestamp: new Date().toISOString(),
  };
}

const isProductionEnv = () => process.env.NODE_ENV === 'production';

/**
 * Sends a standardized error response. Use in routes instead of ad-hoc res.status().json({ error: '...' }).
 */
export function sendApiError(
  res: { status: (code: number) => { json: (body: unknown) => void } },
  statusCode: number,
  error: string,
  code?: ErrorCodeType,
  errors?: Record<string, string[]>
): void {
  const { body } = formatErrorResponse({
    statusCode,
    error,
    code,
    errors,
    isProduction: isProductionEnv(),
  });
  res.status(statusCode).json(body);
}
