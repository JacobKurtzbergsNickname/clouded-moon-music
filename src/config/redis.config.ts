import { RedisOptions } from "ioredis";

export const getRedisConfig = (): RedisOptions => {
  const tlsEnabled = process.env.REDIS_TLS === "true";

  return {
    host: process.env.REDIS_HOST ?? "localhost",
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD ?? undefined,
    db: process.env.REDIS_DB ? Number(process.env.REDIS_DB) : undefined,
    tls: tlsEnabled ? {} : undefined,
  };
};
