/**
 * Test Utilities and Mocks
 *
 * Shared helpers for tests (mock Request/Response/session). For unit tests
 * of application code under src/utils/, see tests/unit/utils/.
 */

import { Request, Response, NextFunction } from 'express';
import { Session } from 'express-session';

/**
 * Creates a mock Express Request object
 */
export const createMockRequest = (overrides?: Partial<Request>): Partial<Request> => {
    return {
        body: {},
        params: {},
        query: {},
        session: undefined,
        ...overrides,
    } as Partial<Request>;
};

/**
 * Creates a mock Express Response object
 */
export const createMockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        clearCookie: jest.fn().mockReturnThis(),
    };
    return res;
};

/**
 * Creates a mock Express NextFunction
 */
export const createMockNext = (): NextFunction => {
    return jest.fn();
};

/**
 * Creates a mock session with user data
 */
export const createMockSession = (user?: Partial<{
    id: string;
    username: string;
    fullName: string;
    email: string;
    role: string;
    libraryId?: string;
}>): any => {
    const defaultUser = {
        id: 'test-user-id',
        username: 'testuser',
        fullName: 'Test User',
        email: 'test@example.com',
        role: 'library_admin',
        libraryId: 'test-library-id',
    };

    return {
        user: { ...defaultUser, ...user },
        destroy: jest.fn((callback: (err?: Error) => void) => callback(undefined)),
    };
};
