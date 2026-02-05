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

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
