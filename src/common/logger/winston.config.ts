// src/common/logger/winston.config.ts

import * as winston from "winston";
import "winston-daily-rotate-file";

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Define a custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Define the logger configuration
const logger = winston.createLogger({
  level: "info", // Default log level
  format: combine(
    colorize(), // Colorize the output for console
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }), // Capture stack traces
    logFormat,
  ),
  transports: [
    // Console transport
    new winston.transports.Console(),

    // Daily rotate file transport for info level
    new winston.transports.DailyRotateFile({
      filename: "logs/application-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "info",
      maxFiles: "14d", // Keep logs for 14 days
      zippedArchive: true,
    }),

    // Daily rotate file transport for error level
    new winston.transports.DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxFiles: "30d",
      zippedArchive: true,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: "logs/exceptions.log" }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: "logs/rejections.log" }),
  ],
  exitOnError: false, // Do not exit on handled exceptions
});

export default logger;
