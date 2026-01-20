import { Request, Response, NextFunction } from 'express';

// UUID validation middleware
interface UUIDRequest extends Request {
    params: {
        id: string;
        [key: string]: string;
    };
}

export const validateUUID = (req: UUIDRequest, res: Response, next: NextFunction): Response | void => {
    const { id } = req.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        return res.status(400).json({ error: 'Invalid UUID format' });
    }
    next();
};
