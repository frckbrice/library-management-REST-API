/**
 * Application Logger
 *
 * Winston logger with file transports (error.log, combined.log) and optional
 * console output in non-production. Also exports requestLogger middleware for
 * structured HTTP request logging.
 *
 * @module src/middlewares/logger
 */

import { createLogger, format, transports } from 'winston';
import { env } from '../config/env';

const logFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
);

const consoleFormat = format.combine(
    format.colorize(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf((info: any) => {
        const { timestamp, level, message, ...meta } = info;
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${level}]: ${message} ${metaStr}`;
    })
);

export const logger = createLogger({
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    defaultMeta: { service: 'library-backend' },
    transports: [
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        new transports.File({ filename: 'logs/combined.log' }),
    ],
});

if (env.NODE_ENV !== 'production') {
    logger.add(
        new transports.Console({
            format: consoleFormat,
        })
    );
}

/**
 * Express middleware that logs each request (method, path, status, duration, IP, user-agent)
 * and optionally the response body for paths under /api.
 */
export const requestLogger = (req: any, res: any, next: any) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson: any, ...args: any[]) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on('finish', () => {
        const duration = Date.now() - start;
        if (path.startsWith('/api')) {
            logger.info('HTTP Request', {
                method: req.method,
                path,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                ip: req.ip,
                userAgent: req.get('user-agent'),
                ...(capturedJsonResponse && { response: capturedJsonResponse }),
            });
        }
    });

    next();
};
