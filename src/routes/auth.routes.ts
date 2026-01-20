import type { Express, Request, Response, NextFunction } from "express";
import { compare } from "bcrypt";
import drizzleService from "../../services/drizzle-services";
import { validate } from "../../utils/validations";
import { loginSchema } from "../validations/auth.schemas";
import { AuthenticationError } from "../utils/errors";
import { authLimiter } from '../../middlewares/rate-limiters';

export function registerAuthRoutes(app: Express, global_path: string) {
    // Authentication routes
    app.post(`${global_path}/auth/login`, authLimiter, validate(loginSchema), async (req, res, next) => {
        try {
            const { username, password } = req.body;

            const user = await drizzleService.getUserByUsername(username);

            if (!user) {
                throw new AuthenticationError('Invalid username or password');
            }

            // Compare password using bcrypt
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
                libraryId: String(user.libraryId)
            };

            return res.status(200).json({
                success: true,
                data: {
                    id: user.id,
                    username: user.username,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                    libraryId: user.libraryId
                }
            });
        } catch (error) {
            next(error);
        }
    });

    app.get(`${global_path}/auth/session`, (req, res) => {
        if (req.session.user) {
            return res.status(200).json({
                success: true,
                data: req.session.user
            });
        }
        return res.status(200).json({
            success: true,
            data: null
        });
    });

    app.post(`${global_path}/auth/logout`, (req, res, next) => {
        req.session.destroy((err) => {
            if (err) {
                return next(err);
            }
            res.clearCookie('connect.sid');
            return res.status(200).json({ success: true, message: 'Logged out successfully' });
        });
    });
}
