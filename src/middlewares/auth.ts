/**
 * Authentication & Authorization Middlewares
 *
 * Protects routes by requiring a valid session and optionally specific roles.
 * Use requireAuth for any authenticated route; use requireRole or the preset
 * requireSuperAdmin / requireLibraryAdmin for role-based access.
 *
 * @module src/middlewares/auth
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticationError, AuthorizationError } from '../utils/errors';

/**
 * Ensures the request has an authenticated session. Passes AuthenticationError
 * to next() if req.session or req.session.user is missing.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.user) {
    return next(new AuthenticationError('Authentication required'));
  }
  next();
};

/**
 * Factory that returns a middleware requiring the user to have one of the given roles.
 * Checks authentication first, then role. Passes AuthorizationError if role is not allowed.
 *
 * @param roles - Allowed roles (e.g. 'library_admin', 'super_admin')
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session || !req.session.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    if (!roles.includes(req.session.user.role)) {
      return next(new AuthorizationError(`Access denied. Required roles: ${roles.join(', ')}`));
    }

    next();
  };
};

/** Middleware that allows only super_admin role. */
export const requireSuperAdmin = requireRole('super_admin');

/** Middleware that allows library_admin or super_admin. */
export const requireLibraryAdmin = requireRole('library_admin', 'super_admin');
