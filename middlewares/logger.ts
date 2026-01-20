/**
 * Logging Middleware
 * 
 * Provides request logging functionality that:
 * - Logs all API requests to log files
 * - Tracks request duration
 * - Outputs formatted logs to console in development
 * - Maintains backward compatibility with existing logEvents function
 * 
 * Usage:
 *   import logger from './middlewares/logger';
 *   app.use(logger);
 * 
 * Log Files:
 *   - logs/reqLog.log - All API requests
 *   - logs/errLog.log - Errors (via error handler)
 * 
 * Log Format:
 *   Development: Console output with method, path, status, duration
 *   Production: File logs with timestamp, UUID, and request details
 */

import { format } from 'date-fns';
import { v4 as UUIDV4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { env } from '../src/config/env';

const fsPromises = fs.promises;

/**
 * Writes log events to log files
 * @param message - Log message to write
 * @param logFileName - Name of the log file (e.g., 'reqLog.log', 'errLog.log')
 */
const logEvents = async (message: string, logFileName: string) => {
    const dateTime = `${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`;
    const logItem = `${dateTime}\t${UUIDV4()}\t${message}\n`;
    const logPath = path.join(__dirname, '..', 'logs');

    try {
        if (!fs.existsSync(logPath)) {
            await fsPromises.mkdir(logPath);
        }
        await fsPromises.appendFile(path.join(__dirname, '..', 'logs', logFileName), logItem);
    } catch (err) {
        console.error(err);
    }
};

/**
 * Request logging middleware
 * - Logs all API requests to file
 * - Tracks request duration
 * - Outputs formatted logs in development mode
 * 
 * Usage:
 *   app.use(logger);
 */
const logger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    // Capture response body for logging
    const originalResJson = res.json;
    res.json = function (bodyJson: any, ...args: any[]) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
    };

    // Log after response is sent
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (path.startsWith('/api')) {
            const logMessage = `${req.method}\t${req.headers.origin}\t${req.url}`;
            logEvents(logMessage, 'reqLog.log');

            // Console output in development for easier debugging
            if (env.NODE_ENV === 'development') {
                const logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
                console.log(logLine);
            }
        }
    });

    next();
};

export default logger;
export { logEvents };