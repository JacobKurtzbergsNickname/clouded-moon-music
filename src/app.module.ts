import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { WinstonModule } from "nest-winston";
import winston from "winston";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { SongsModule } from "./songs/songs.module";
import { LoggerMiddleware } from "./common/middleware/logger.middleware";
import { LoggerModule } from "./common/logger/logger.module";
import { SongsController } from "./songs/songs.controller";

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI ?? "mongodb://localhost:27017/clouded-moon-music",
      {
        retryAttempts: 3,
        retryDelay: 1000,
        connectionFactory: (connection) => {
          connection.on("connected", () => {
            winston.info("MongoDB connected successfully");
          });
          connection.on("error", (error) => {
            winston.error("MongoDB connection error:", error);
          });
          connection.on("disconnected", () => {
            winston.warn("MongoDB disconnected");
          });
          return connection;
        },
      },
    ),
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
