// src/common/logger/logger.module.ts

import { Module } from "@nestjs/common";
import { WinstonModule } from "nest-winston";
import { CMLogger } from "./logger.service";
import winstonLogger from "./winston.config";

@Module({
  imports: [
    WinstonModule.forRoot({
      instance: winstonLogger,
    }),
  ],
  providers: [CMLogger],
  exports: [CMLogger],
})
export class LoggerModule {}
