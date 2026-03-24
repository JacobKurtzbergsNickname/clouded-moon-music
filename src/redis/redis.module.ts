import { Global, Logger, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import Redis from "ioredis";

import { REDIS_CLIENT } from "./redis.constants";
import { RedisService } from "./redis.service";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const logger = new Logger("RedisModule");
        const client = new Redis({
          host: config.get<string>("REDIS_HOST"),
          port: config.get<number>("REDIS_PORT"),
          password: config.get<string>("REDIS_PASSWORD"),
          db: config.get<number>("REDIS_DB"),
        });

        client.on("connect", () => logger.log("Redis connected"));
        client.on("error", (error) =>
          logger.error("Redis connection error", error),
        );
        client.on("end", () => logger.warn("Redis connection closed"));

        return client;
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
