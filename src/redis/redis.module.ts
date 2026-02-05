import { Global, Logger, Module } from "@nestjs/common";
import Redis from "ioredis";

import { getRedisConfig } from "../config/redis.config";
import { REDIS_CLIENT } from "./redis.constants";
import { RedisService } from "./redis.service";

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const logger = new Logger("RedisModule");
        const client = new Redis(getRedisConfig());

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
