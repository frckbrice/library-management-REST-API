/**
 * Authentication Service
 *
 * Validates credentials against the database and returns session user payloads.
 * Uses bcrypt for password comparison. Throws AuthenticationError on invalid
 * username or password.
 *
 * @module src/services/auth.service
 */

import { compare } from 'bcrypt';
import drizzleService from './drizzle-services';
import { AuthenticationError } from '../utils/errors';
import { logger } from '../middlewares/logger';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SessionUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  libraryId: string;
}

export class AuthService {
  /**
   * Verifies username/password and returns the session user object. Logs
   * successful authentication.
   */
  async authenticateUser(credentials: LoginCredentials): Promise<SessionUser> {
    const { username, password } = credentials;

    const user = await drizzleService.getUserByUsername(username);

    if (!user) {
      throw new AuthenticationError('Invalid username or password');
    }

    const passwordMatch = await compare(password, user.password);

    if (!passwordMatch) {
      throw new AuthenticationError('Invalid username or password');
    }

    logger.info('User authenticated', { userId: user.id, username: user.username });

    return {
      id: user.id as string,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      libraryId: String(user.libraryId),
    };
  }

  /** Fetches a user by ID from the database. */
  async getUserById(userId: string) {
    return drizzleService.getUser(userId);
  }

  /** Fetches a user by username from the database. */
  async getUserByUsername(username: string) {
    return drizzleService.getUserByUsername(username);
  }
}

export const authService = new AuthService();
