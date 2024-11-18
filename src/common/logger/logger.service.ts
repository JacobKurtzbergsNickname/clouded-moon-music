// src/common/logger/logger.service.ts

import { Injectable, LoggerService } from "@nestjs/common";
import { Logger, createLogger, format, transports } from "winston";
import { LogEntry } from "./interfaces";

@Injectable()
export class CMLogger implements LoggerService {
  private readonly logger: Logger;

  constructor() {
    this.logger = createLogger({
      level: "info",
      format: format.combine(format.timestamp(), format.json()),
      transports: [
        new transports.Console(),
        new transports.File({ filename: "logs/error.log", level: "error" }),
        new transports.File({ filename: "logs/combined.log" }),
      ],
    });
  }

  log(message: string, logEntry: LogEntry) {
    this.logger.info(message);
  }

  error(message: string, trace: string) {
    this.logger.error(`${message} - Trace: ${trace}`);
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  debug(message: string) {
    this.logger.debug(message);
  }

  verbose(message: string) {
    this.logger.verbose(message);
  }
}
