/**
 * API Rate Limiters
 *
 * Preconfigured express-rate-limit instances for different route groups.
 * Uses centralized error response format (success, error, code, timestamp).
 *
 * @module src/middlewares/rate-limiters
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { formatErrorResponse, ErrorCode } from '../utils/api-response';

declare module 'express' {
  interface Request {
    rateLimit?: {
      resetTime?: number;
      [key: string]: unknown;
    };
  }
}

const isProduction = process.env.NODE_ENV === 'production';

/** Returns a 429 handler using the shared error response format. */
const createLimitHandler = (message: string) => {
  return (req: Request, res: Response) => {
    const retryAfter = Math.round((req as any).rateLimit?.resetTime / 1000) || 60;
    const { statusCode, body } = formatErrorResponse({
      statusCode: 429,
      error: message,
      code: ErrorCode.RATE_LIMITED,
      isProduction,
    });
    res.status(statusCode).json({ ...body, retryAfter });
  };
};

/** 100 requests per 15 minutes per IP for general API. */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: createLimitHandler('Too many API requests, please try again in 15 minutes.')
});

/** 5 attempts per 15 minutes per IP for auth; successful requests not counted. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login requests per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: createLimitHandler('Too many login attempts. Please try again in 15 minutes.')
});

/** 3 contact form submissions per hour per IP. */
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 contact form submissions per hour
  message: 'Too many contact form submissions from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Too many contact form submissions. Please try again in 1 hour.')
});

/** 10 file uploads per hour per IP. */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 file uploads per hour
  message: 'Too many file uploads from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Too many file uploads. Please try again in 1 hour.')
});

/** 200 admin requests per hour per IP. */
export const adminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200, // limit each IP to 200 admin requests per hour
  message: 'Too many admin actions from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Too many admin actions. Please try again in 1 hour.')
});

/** 500 requests per hour per IP for public content (libraries, stories, events, media). */
export const publicLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500, // limit each IP to 500 public requests per hour
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Too many requests. Please try again in 1 hour.')
});

/** 3 password reset attempts per hour per IP. */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: 'Too many password reset attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Too many password reset attempts. Please try again in 1 hour.')
});

/** 10 email sends per hour per IP. */
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 email sends per hour
  message: 'Too many emails sent from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Too many emails sent. Please try again in 1 hour.')
});

/** 100 search requests per 15 minutes per IP. */
export const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 search requests per windowMs
  message: 'Too many search requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Too many search requests. Please try again in 15 minutes.')
});
