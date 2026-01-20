/**
 * Authentication & Authorization Middleware
 * 
 * These middleware functions protect routes by checking authentication
 * and authorization. They throw custom errors that are automatically
 * handled by the error handler middleware.
 * 
 * Usage:
 *   router.get('/admin/stories', requireAuth, handler);
 *   router.post('/superadmin/users', requireSuperAdmin, handler);
 *   router.patch('/libraries/:id', requireLibraryAdmin, handler);
 * 
 * Error Handling:
 *   - AuthenticationError (401) if user is not authenticated
 *   - AuthorizationError (403) if user lacks required role
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticationError, AuthorizationError } from '../src/utils/errors';

/**
 * Requires user to be authenticated
 * Throws AuthenticationError if req.session.user is not set
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.user) {
        throw new AuthenticationError('Authentication required');
    }
    next();
};

/**
 * Requires user to have one of the specified roles
 * @param roles - Array of allowed roles (e.g., ['super_admin', 'library_admin'])
 * @returns Middleware function that checks role
 */
export const requireRole = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.session?.user) {
            throw new AuthenticationError('Authentication required');
        }

        if (!roles.includes(req.session.user.role)) {
            throw new AuthorizationError(`Access denied. Required roles: ${roles.join(', ')}`);
        }

        next();
    };
};

/**
 * Requires super_admin role
 * Convenience middleware for super admin only routes
 */
export const requireSuperAdmin = requireRole('super_admin');

/**
 * Requires library_admin or super_admin role
 * Convenience middleware for admin routes (both library and super admins)
 */
export const requireLibraryAdmin = requireRole('library_admin', 'super_admin');
