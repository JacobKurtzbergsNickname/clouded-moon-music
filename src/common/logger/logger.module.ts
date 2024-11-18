// src/common/logger/logger.module.ts

import { Module } from "@nestjs/common";
import { CMLogger } from "./logger.service";
import { WinstonModule } from "nest-winston";
import * as winston from "winston";

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
        }),
        new winston.transports.File({ filename: "logs/combined.log" }),
      ],
    }),
  ],
  providers: [CMLogger],
  exports: [CMLogger],
})
export class LoggerModule {}
