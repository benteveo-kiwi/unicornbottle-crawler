import { createLogger, format, transports } from "winston";

let LOGGER : any = null;

/**
 * Gets the logger. If the process number is present in argv, then it attempts
 * to use that to create a filepath. Otherwise it defaults to crawler-1337.log.
 * The same logger instance is returned every time this function is called to
 * prevent any potential concurrency issues, although winston is not
 * multiprocess safe. Every process needs to log to their own file.
 */
function getLogger() {
    if(LOGGER) {
        return LOGGER;
    }
    let instanceNb = process.argv[2] ? process.argv[2] : 1337;
    let filename = `/var/log/ub-crawler/crawler-${instanceNb}.log`;

    const logger = createLogger({
        level: 'info',
        format: format.combine(
            format.errors({ stack: true }),
            format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            format.printf(info => {
                if(info.stack) {
                    return `${info.timestamp} [${info.level}] : ${info.message} ${info.stack}`;
                } else {
                    return `${info.timestamp} [${info.level}] : ${info.message}`;
                }
            })
        ),
        defaultMeta: { service: `crawl-service` },
        transports: [
            new transports.Console({}),
            new transports.File({ filename: filename })
        ]
    });

    LOGGER = logger

    return logger
}


export { getLogger }
