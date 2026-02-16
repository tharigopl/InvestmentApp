const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format (colorized for development)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info', // debug, info, warn, error
  format: logFormat,
  defaultMeta: { service: 'investment-app' },
  transports: [
    // Write all logs to console in development
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.NODE_ENV === 'production' ? 'error' : 'debug'
    }),

    // Write all logs with level 'error' to error.log
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// If we're in production, log to daily rotating files
if (process.env.NODE_ENV === 'production') {
  const DailyRotateFile = require('winston-daily-rotate-file');

  logger.add(
    new DailyRotateFile({
      filename: path.join(__dirname, '../logs/application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d', // Keep logs for 14 days
      level: 'info',
    })
  );
}

// Create a stream object for Morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

module.exports = logger;