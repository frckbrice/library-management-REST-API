/**
 * Shared Validation Utilities
 *
 * Express middleware for common validations (e.g. UUID path params). Use in
 * routes that expect :id in params to return 400 for invalid UUID format.
 *
 * @module src/utils/validations
 */

import { Request, Response, NextFunction } from 'express';
import { sendApiError, ErrorCode } from './api-response';

interface UUIDRequest extends Request {
    params: {
        id: string;
        [key: string]: string;
    };
}

/** Validates req.params.id is a valid UUID v4; sends 400 with standard error format otherwise. */
export const validateUUID = (req: UUIDRequest, res: Response, next: NextFunction): void => {
    const { id } = req.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        sendApiError(res, 400, 'Invalid UUID format', ErrorCode.VALIDATION_ERROR);
        return;
    }
    next();
};
