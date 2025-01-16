import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { SongsModule } from "./songs/songs.module";
import { LoggerMiddleware } from "./common/middleware/logger.middleware";
import { WinstonModule } from "nest-winston";
import { LoggerModule } from "./common/logger/logger.module";
import winston from "winston";
import { SongsController } from "./songs/songs.controller";

@Module({
  imports: [
    SongsModule,
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
    LoggerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes(SongsController);
  }
}
