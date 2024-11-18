// src/common/logger/interfaces/log.interface.ts

export interface LogEntry {
  timestamp: string;
  level: "info" | "error" | "warn" | "debug" | "verbose";
  message: string;
  requestId?: string;
  [key: string]: any; // Allow additional properties
}
