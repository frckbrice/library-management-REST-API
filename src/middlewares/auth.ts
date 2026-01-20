import { Request, Response, NextFunction } from 'express';
import { AuthenticationError, AuthorizationError } from '../utils/errors';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.user) {
    throw new AuthenticationError('Authentication required');
  }
  next();
};

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

export const requireSuperAdmin = requireRole('super_admin');
export const requireLibraryAdmin = requireRole('library_admin', 'super_admin');
