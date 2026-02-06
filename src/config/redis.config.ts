import { RedisOptions } from "ioredis";

export class RedisConfig {
  private readonly host: string;
  private readonly port: number;
  private readonly password?: string;
  private readonly db?: number;
  private readonly tlsEnabled: boolean;

  constructor(env: NodeJS.ProcessEnv) {
    this.host = env.REDIS_HOST ?? "localhost";
    this.port = Number(env.REDIS_PORT ?? 6379);
    this.password = env.REDIS_PASSWORD ?? undefined;
    this.db = env.REDIS_DB ? Number(env.REDIS_DB) : undefined;
    this.tlsEnabled = env.REDIS_TLS === "true";
  }

  getConfig(): RedisOptions {
    return {
      host: this.host,
      port: this.port,
      password: this.password,
      db: this.db,
      tls: this.tlsEnabled ? {} : undefined,
    };
  }
}

export const getRedisConfig = (): RedisOptions => {
  const config = new RedisConfig(process.env);
  return config.getConfig();
};
