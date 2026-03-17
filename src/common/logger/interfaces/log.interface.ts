// src/common/logger/interfaces/log.interface.ts

import { v4 } from "uuid";

export type LogLevel = "info" | "error" | "warn" | "debug" | "verbose";

export interface ILogEntry {
  /** ISO timestamp — set automatically by LogEntry constructor; callers should not set this manually. */
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  requestId?: string;
  [key: string]: unknown; // Allow additional properties
}

export class LogEntry implements ILogEntry {
  constructor(message: string, requestId?: string, level: LogLevel = "info") {
    this.timestamp = new Date().toISOString();
    this.level = level;
    this.message = message;
    this.requestId = requestId || v4();
  }

  timestamp: string;

  level: LogLevel;

  message: string;

  requestId?: string;

  [key: string]: any;
}
