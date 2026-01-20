import { format } from 'date-fns';
import { v4 as UUIDV4 } from 'uuid';

import fs from 'fs';
import path from 'path';

const fsPromises = fs.promises;

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

const logger = (req: any, res: any, next: any) => {
    logEvents(`${req.method}\t${req.headers.origin}\t${req.url}`, 'reqLog.log');
    console.log(`${req.method} ${req.path}`);
    next();
};

export default logger;
export { logEvents };