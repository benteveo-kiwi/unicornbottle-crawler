import { createLogger, format, transports } from "winston";

function getLogger(name : string) {
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
        defaultMeta: { service: `crawl-${name}` },
        transports: [
            new transports.Console({}),
            new transports.File({ filename: `/var/log/ub-crawler/${name}.log` })
        ]
    });

    return logger
}


export { getLogger }
