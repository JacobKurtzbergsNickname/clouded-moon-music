import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WinstonModule } from "nest-winston";
import winston from "winston";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { LoggerMiddleware } from "./common/middleware/logger.middleware";
import { LoggerModule } from "./common/logger/logger.module";
import { SongsModule } from "./songs/songs.module";
import { SongsController } from "./songs/songs.controller";
import { getMongoDbUri } from "./config/mongodb.config";
import { getPostgresConfig } from "./config/postgres.config";
import { RedisModule } from "./redis/redis.module";

const mongoConnectionFactory = (connection: Connection) => {
  connection.on("connected", () => {
    winston.info("MongoDB connected successfully");
  });

  connection.on("error", (error: Error) => {
    winston.error("MongoDB connection error:", error);
  });

  connection.on("disconnected", () => {
    winston.warn("MongoDB disconnected");
  });

  return connection;
};

@Module({
  imports: [
    MongooseModule.forRoot(getMongoDbUri(), {
      retryAttempts: 3,
      retryDelay: 1000,
      connectionFactory: mongoConnectionFactory,
    }),

    TypeOrmModule.forRoot(getPostgresConfig(__dirname)),

    SongsModule,
    RedisModule,

    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
        }),
        new winston.transports.File({
          filename: "logs/combined.log",
        }),
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
