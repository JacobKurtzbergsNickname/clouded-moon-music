import { RedisConfig, getRedisConfig } from "./redis.config";

describe("RedisConfig", () => {
  describe("constructor", () => {
    it("should use default values when env vars not set", () => {
      const config = new RedisConfig({});
      const result = config.getConfig();

      expect(result).toMatchObject({
        host: "localhost",
        port: 6379,
      });
    });

    it("should use env var values when set", () => {
      const config = new RedisConfig({
        REDIS_HOST: "redis.example.com",
        REDIS_PORT: "6380",
        REDIS_PASSWORD: "secret",
        REDIS_DB: "2",
      });
      const result = config.getConfig();

      expect(result).toMatchObject({
        host: "redis.example.com",
        port: 6380,
        password: "secret",
        db: 2,
      });
    });

    it("should enable TLS when REDIS_TLS is true", () => {
      const config = new RedisConfig({ REDIS_TLS: "true" });
      const result = config.getConfig();

      expect(result.tls).toBeDefined();
    });

    it("should not enable TLS when REDIS_TLS is not true", () => {
      const config = new RedisConfig({ REDIS_TLS: "false" });
      const result = config.getConfig();

      expect(result.tls).toBeUndefined();
    });

    it("should have undefined password when not set", () => {
      const config = new RedisConfig({});
      const result = config.getConfig();

      expect(result.password).toBeUndefined();
    });

    it("should have undefined db when REDIS_DB not set", () => {
      const config = new RedisConfig({});
      const result = config.getConfig();

      expect(result.db).toBeUndefined();
    });
  });

  describe("getRedisConfig", () => {
    it("should return a RedisOptions object", () => {
      const result = getRedisConfig();

      expect(result).toBeDefined();
      expect(result.host).toBeDefined();
      expect(result.port).toBeDefined();
    });
  });
});
