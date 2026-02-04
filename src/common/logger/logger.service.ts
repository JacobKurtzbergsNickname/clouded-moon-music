// src/common/logger/logger.service.ts

import { Injectable, LoggerService, LogLevel, Inject } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";
import { ILogEntry } from "./interfaces";

@Injectable()
export class CMLogger implements LoggerService {
  private logLevels: LogLevel[] = ["log", "error", "warn", "debug", "verbose"];

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * Check if a log level is enabled
   */
  private isLevelEnabled(level: LogLevel): boolean {
    return this.logLevels.includes(level);
  }

  // 1. Implement the generic log() method
  log(message: any, ...optionalParams: any[]): void {
    if (!this.isLevelEnabled("log")) return;

    const context = optionalParams[0];
    if (context) {
      this.logger.info(message, { context });
    } else {
      this.logger.info(message);
    }
  }

  // 2. Implement the fatal() method
  // Note: fatal() always logs regardless of logLevels (critical errors)
  fatal(message: any, ...optionalParams: any[]): void {
    const context = optionalParams[0];
    const stack = optionalParams[1];

    if (stack) {
      this.logger.error(message, { context, stack, level: "fatal" });
    } else if (context) {
      this.logger.error(message, { context, level: "fatal" });
    } else {
      this.logger.error(message, { level: "fatal" });
    }
  }

  // 3. Implement setLogLevels()
  setLogLevels(levels: LogLevel[]): void {
    this.logLevels = levels;
    // Update Winston logger level to the most verbose enabled level
    // Order: verbose (most) > debug > log/info > warn > error (least)
    if (levels.includes("verbose")) {
      this.logger.level = "verbose";
    } else if (levels.includes("debug")) {
      this.logger.level = "debug";
    } else if (levels.includes("log")) {
      this.logger.level = "info";
    } else if (levels.includes("warn")) {
      this.logger.level = "warn";
    } else if (levels.includes("error")) {
      this.logger.level = "error";
    } else {
      this.logger.level = "error"; // Safest default
    }
  }

  // Overload signatures
  info(message: string): void;
  info(message: string, logEntry: ILogEntry): void;

  // Implementation
  info(message: string, logEntry?: ILogEntry): void {
    if (!this.isLevelEnabled("log")) return;

    if (logEntry) {
      this.logger.info(message, logEntry);
    } else {
      this.logger.info(message);
    }
  }

  error(message: string, trace?: string): void {
    if (!this.isLevelEnabled("error")) return;

    if (trace) {
      this.logger.error(`${message} - Trace: ${trace}`);
    } else {
      this.logger.error(message);
    }
  }

  warn(message: string): void {
    if (!this.isLevelEnabled("warn")) return;

    this.logger.warn(message);
  }

  debug(message: string): void {
    if (!this.isLevelEnabled("debug")) return;

    this.logger.debug(message);
  }

  verbose(message: string): void {
    if (!this.isLevelEnabled("verbose")) return;

    this.logger.verbose(message);
  }
}
