// src/common/logger/logger.middleware.ts

import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import { CMLogger, ILogEntry, LogEntry } from "../logger";
import { v4 } from "uuid";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

type TimeTuple = [number, number];

// Define Morgan format with request ID
const MORGAN_FORMAT =
  ":method :url :status :res[content-length] - :response-time ms - reqId=:reqId";

const requestWas = (req: Request): string => {
  return `Request: ${req.requestId} - ${req.method} ${req.originalUrl}`;
};

const responseWas = (req: Request, res: Response, start: TimeTuple): string => {
  return `Response: ${req.method} ${req.originalUrl} - ${res.statusCode} ${elpasedTime(start)}ms`;
};

const elpasedTime = (start: TimeTuple): string => {
  const elapsedHrTime = process.hrtime(start);
  const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;
  return elapsedTimeInMs.toFixed(3);
};

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private morganMiddleware: ReturnType<typeof morgan>;

  constructor(private readonly logger: CMLogger) {
    // Define custom token for request ID
    morgan.token("reqId", (req: Request): string => req.requestId || "N/A");

    // Create Morgan middleware instance with typed stream
    this.morganMiddleware = morgan(MORGAN_FORMAT, {
      stream: {
        write: (message: string): void => {
          // Create a structured log entry
          const logEntry: ILogEntry = {
            timestamp: new Date().toISOString(),
            level: "info",
            message: message.trim(),
            // If you have a way to pass requestId, include it here
          };
          this.logger.info("Morgan", logEntry);
        },
      },
      skip: () => false, // Log all requests
    });
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // Assign a unique ID to the request
    req.requestId = v4();

    this.logger.info(
      "HTTP Request",
      new LogEntry(requestWas(req), req.requestId),
    );

    const start = process.hrtime();

    res.on("finish", () => {
      this.logger.info(
        "HTTP Response",
        new LogEntry(responseWas(req, res, start), req.requestId),
      );
    });

    // Invoke Morgan middleware
    this.morganMiddleware(req, res, next);
  }
}
