import 'express-session';

declare module 'express-session' {
    interface SessionData {
        user?: {
            id: string;
            username: string;
            fullName: string;
            email: string;
            role: string;
            libraryId?: string;
        };
    }
}

export { };
