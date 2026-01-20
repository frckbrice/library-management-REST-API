import { Request, Response } from 'express';
import { compare } from 'bcrypt';
import drizzleService from '../../services/drizzle-services';
import { AuthenticationError } from '../utils/errors';
import { logger } from '../middlewares/logger';

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;

    const user = await drizzleService.getUserByUsername(username);

    if (!user) {
      throw new AuthenticationError('Invalid username or password');
    }

    const passwordMatch = await compare(password, user.password);

    if (!passwordMatch) {
      throw new AuthenticationError('Invalid username or password');
    }

    // Create session data
    req.session.user = {
      id: user.id as string,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      libraryId: String(user.libraryId),
    };

    logger.info('User logged in', { userId: user.id, username: user.username });

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        libraryId: user.libraryId,
      },
    });
  }

  async getSession(req: Request, res: Response): Promise<void> {
    if (req.session.user) {
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
