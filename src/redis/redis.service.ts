import { Inject, Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

import { REDIS_CLIENT } from "./redis.constants";

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  getClient(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(
    key: string,
    value: string,
    ttlSeconds?: number,
  ): Promise<"OK" | null> {
    if (ttlSeconds) {
      return this.client.set(key, value, "EX", ttlSeconds);
    }

    return this.client.set(key, value);
  }

  async del(...keys: string[]): Promise<number> {
    return this.client.del(...keys);
  }

  async deletePattern(pattern: string): Promise<number> {
    let cursor = "0";
    const keysToDelete: string[] = [];

    do {
      const [nextCursor, keys] = await this.client.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        1000,
      );

      if (keys.length > 0) {
        keysToDelete.push(...keys);
      }

      cursor = nextCursor;
    } while (cursor !== "0");

    if (keysToDelete.length === 0) {
      return 0;
    }

    return this.client.del(...keysToDelete);
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
