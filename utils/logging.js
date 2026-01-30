const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.printf(({ timestamp, level, message, label, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} - ${label || 'bot'} - ${level.toUpperCase()} - ${message}${metaStr}`;
    })
);

const loggers = {};

function setupLogging() {
    // This is called once at bot startup
}

function getLogger(name = 'bot') {
    if (loggers[name]) {
        return loggers[name];
    }

    const logger = winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: logFormat,
        defaultMeta: { label: name },
        transports: [
            new winston.transports.File({
                filename: path.join(logDir, 'error.log'),
                level: 'error',
                maxsize: 5242880, // 5MB
                maxFiles: 5
            }),
            new winston.transports.File({
                filename: path.join(logDir, 'combined.log'),
                maxsize: 5242880,
                maxFiles: 5
            }),
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.printf(({ timestamp, level, message, label }) => {
                        return `${timestamp} - ${label || 'bot'} - ${level} - ${message}`;
                    })
                )
            })
        ]
    });

    loggers[name] = logger;
    return logger;
}

module.exports = { setupLogging, getLogger };
