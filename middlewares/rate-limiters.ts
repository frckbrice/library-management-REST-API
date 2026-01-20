import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Extend Express Request type to include rateLimit property
declare module 'express' {
  interface Request {
    rateLimit?: {
      resetTime?: number;
      [key: string]: any;
    };
  }
}

// Helper function to create custom error messages
const createLimitHandler = (message: string) => {
  return (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message,
      retryAfter: Math.round((req as any).rateLimit?.resetTime / 1000) || 60
    });
  };
};

// General API rate limiter - 100 requests per 15 minutes
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: createLimitHandler('Too many API requests, please try again in 15 minutes.')
});

// Strict limiter for authentication endpoints - 5 attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login requests per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: createLimitHandler('Too many login attempts. Please try again in 15 minutes.')
});

// Contact form limiter - 3 submissions per hour
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 contact form submissions per hour
  message: 'Too many contact form submissions from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Too many contact form submissions. Please try again in 1 hour.')
});

// File upload limiter - 10 uploads per hour
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 file uploads per hour
  message: 'Too many file uploads from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Too many file uploads. Please try again in 1 hour.')
});

// Admin actions limiter - 200 requests per hour
export const adminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200, // limit each IP to 200 admin requests per hour
  message: 'Too many admin actions from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Too many admin actions. Please try again in 1 hour.')
});

// Public content limiter - 500 requests per hour (more generous for browsing)
export const publicLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500, // limit each IP to 500 public requests per hour
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Too many requests. Please try again in 1 hour.')
});

// Password reset limiter - 3 attempts per hour
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: 'Too many password reset attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Too many password reset attempts. Please try again in 1 hour.')
});

// Email sending limiter - 10 emails per hour
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 email sends per hour
  message: 'Too many emails sent from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Too many emails sent. Please try again in 1 hour.')
});

// Search limiter - 100 searches per 15 minutes
export const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 search requests per windowMs
  message: 'Too many search requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Too many search requests. Please try again in 15 minutes.')
});