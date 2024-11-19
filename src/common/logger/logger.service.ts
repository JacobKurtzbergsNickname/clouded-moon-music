// src/common/logger/logger.service.ts

import { Injectable, LoggerService } from "@nestjs/common";
import { Logger } from "winston";
import { ILogEntry } from "./interfaces";
import winstonLogger from "./winston.config";

@Injectable()
export class CMLogger implements LoggerService {
  private readonly logger: Logger = winstonLogger;

  info(message: string, logEntry: ILogEntry) {
    this.logger.info(message, logEntry);
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
