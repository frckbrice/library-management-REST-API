/**
 * Authentication Controller
 *
 * Handles login (session creation), session retrieval, and logout. Uses
 * authService for credential verification and populates req.session.user
 * on success.
 *
 * @module src/controllers/auth.controller
 */

import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { logger } from '../middlewares/logger';

export class AuthController {
  /**
   * Authenticates credentials and creates a session. Responds with user data
   * (id, username, fullName, email, role, libraryId). Expects req.body to be
   * validated by loginSchema (username, password).
   */
  async login(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;

    const sessionUser = await authService.authenticateUser({ username, password });

    req.session.user = sessionUser;

    logger.info('User logged in', { userId: sessionUser.id, username: sessionUser.username });

    res.status(200).json({
      success: true,
      data: {
        id: sessionUser.id,
        username: sessionUser.username,
        fullName: sessionUser.fullName,
        email: sessionUser.email,
        role: sessionUser.role,
        libraryId: sessionUser.libraryId,
      },
    });
  }

  /** Returns current session user or null if not authenticated. */
  async getSession(req: Request, res: Response): Promise<void> {
    if (req.session?.user) {
      res.status(200).json({
        success: true,
        data: req.session.user,
      });
    } else {
      res.status(200).json({
        success: true,
        data: null,
      });
    }
  }

  /** Destroys the session and clears the session cookie. */
  async logout(req: Request, res: Response): Promise<void> {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          reject(err);
          return;
        }
        res.clearCookie('connect.sid');
        res.status(200).json({
          success: true,
          message: 'Logged out successfully',
        });
        resolve();
      });
    });
  }
}

export const authController = new AuthController();
