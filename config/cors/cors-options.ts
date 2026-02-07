/**
 * CORS Configuration
 *
 * Restricts allowed origins to the list in allowed-origins (e.g. frontend URLs).
 * Allows requests with no origin (e.g. same-origin, Postman). Credentials are enabled.
 *
 * @module config/cors/cors-options
 */

import allowOrigins from "./allowed-origins";

const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if ((origin && allowOrigins?.includes(origin)) || !origin) {
            callback(null, true);
        } else {
            callback(new Error("\n\n Origin Not Allowed by Cors"));
        }
    },
    credentials: true,
    optionSuccessStatus: 200,
};

export default corsOptions;
