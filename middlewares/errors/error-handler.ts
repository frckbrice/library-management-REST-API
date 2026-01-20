import { logEvents } from "../logger";

const errorHandler = (err: any, req: any, res: any, next: any) => {
    if (logEvents)
        logEvents(
            `${err.name}:${err.message}\t${req.method}\t${req.url}\t${req.headers.origin}`, 'errLog.log');

    console.error(err.stack);
    const statusCode = res.statusCode ? res.statusCode : 500; // Server Error
    res.status(statusCode).send({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
        method: req.method,
        origin: req.headers.origin,
        timestamp: new Date().toISOString(),
    });

    next(err);
};

export default errorHandler;
