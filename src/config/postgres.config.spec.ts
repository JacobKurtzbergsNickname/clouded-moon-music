import { PostgresConfig, getPostgresConfig } from "./postgres.config";

describe("PostgresConfig", () => {
  describe("constructor", () => {
    it("should use default values when env vars not set", () => {
      const config = new PostgresConfig({});
      const result = config.getConfig("/entities");

      expect(result).toMatchObject({
        type: "postgres",
        host: "localhost",
        port: 5432,
        username: "admin",
        database: "clouded_moon_music",
      });
    });

    it("should use env var values when set", () => {
      const config = new PostgresConfig({
        POSTGRES_HOST: "db.example.com",
        POSTGRES_PORT: "5433",
        POSTGRES_USER: "myuser",
        POSTGRES_PASSWORD: "mypassword",
        POSTGRES_DB: "mydb",
      });
      const result = config.getConfig("/entities");

      expect(result).toMatchObject({
        host: "db.example.com",
        port: 5433,
        username: "myuser",
        password: "mypassword",
        database: "mydb",
      });
    });

    it("should include entities path in config", () => {
      const config = new PostgresConfig({});
      const result = config.getConfig("/app/src");

      expect((result as any).entities).toContain(
        "/app/src/**/*.entity{.ts,.js}",
      );
    });
  });

  describe("getPostgresConfig", () => {
    it("should return a TypeOrmModuleOptions object", () => {
      const result = getPostgresConfig("/app/src");

      expect(result).toBeDefined();
      expect((result as any).type).toBe("postgres");
    });
  });
});
