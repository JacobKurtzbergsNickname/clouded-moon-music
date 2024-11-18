// src/common/logger/logger.middleware.ts

import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import morgan, { Morgan } from "morgan";
import { IncomingMessage, ServerResponse } from "node:http";
import { CMLogger, LogEntry } from "../logger";
import { v4 } from "uuid";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private morganMiddleware: ReturnType<typeof morgan>;

  constructor(private readonly logger: CMLogger) {
    // Define Morgan format with request ID
    const morganFormat =
      ":method :url :status :res[content-length] - :response-time ms - reqId=:reqId";

    // Define custom token for request ID
    morgan.token("reqId", (req: Request): string => req.requestId || "N/A");

    // Create Morgan middleware instance with typed stream
    this.morganMiddleware = morgan(morganFormat, {
      stream: {
        write: (message: string): void => {
          // Create a structured log entry
          const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level: "info",
            message: message.trim(),
            // If you have a way to pass requestId, include it here
          };
          this.logger.log("HTTP Request", logEntry);
        },
      },
      skip: () => false, // Log all requests
    });
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // Assign a unique ID to the request
    req.requestId = v4();

    // Optionally, log the request ID
    const requestLogEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Request ID: ${req.requestId} - ${req.method} ${req.originalUrl}`,
      requestId: req.requestId,
    };
    this.logger.log("info", requestLogEntry);

    const startHrTime = process.hrtime();

    res.on("finish", () => {
      const elapsedHrTime = process.hrtime(startHrTime);
      const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;

      const { method, originalUrl } = req;
      const { statusCode } = res;

      // Create a structured log entry for the response
      const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: "info",
        message: `${method} ${originalUrl} ${statusCode} ${elapsedTimeInMs.toFixed(3)}ms`,
        requestId: req.requestId,
      };

      this.logger.log("HTTP Response", logEntry);
    });

    // Invoke Morgan middleware
    this.morganMiddleware(req, res, next);
  }
}
