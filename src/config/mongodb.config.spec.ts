import { MongoDbConfig, getMongoDbUri } from "./mongodb.config";

describe("MongoDbConfig", () => {
  describe("constructor and getUri", () => {
    it("should use default values when env vars not set", () => {
      const config = new MongoDbConfig({});
      const uri = config.getUri();

      expect(uri).toContain("localhost");
      expect(uri).toContain("27019");
      expect(uri).toContain("clouded_moon_music");
      expect(uri).toContain("admin");
    });

    it("should use env var values when set", () => {
      const config = new MongoDbConfig({
        MONGO_USER: "myuser",
        MONGO_PASSWORD: "mypassword",
        MONGO_HOST: "mongo.example.com",
        MONGO_PORT: "27020",
        MONGO_DATABASE: "mydb",
        MONGO_AUTH_SOURCE: "myauthdb",
      });
      const uri = config.getUri();

      expect(uri).toBe(
        "mongodb://myuser:mypassword@mongo.example.com:27020/mydb?authSource=myauthdb",
      );
    });

    it("should build correct URI format", () => {
      const config = new MongoDbConfig({
        MONGO_USER: "user",
        MONGO_PASSWORD: "pass",
        MONGO_HOST: "host",
        MONGO_PORT: "27017",
        MONGO_DATABASE: "db",
        MONGO_AUTH_SOURCE: "admin",
      });
      const uri = config.getUri();

      expect(uri).toMatch(
        /^mongodb:\/\/[^:]+:[^@]+@[^:]+:\d+\/[^?]+\?authSource=.+$/,
      );
    });
  });

  describe("getMongoDbUri", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("should return MONGODB_URI when set", () => {
      process.env.MONGODB_URI = "mongodb://custom-uri/mydb";

      const uri = getMongoDbUri();

      expect(uri).toBe("mongodb://custom-uri/mydb");
    });

    it("should build URI from individual env vars when MONGODB_URI not set", () => {
      delete process.env.MONGODB_URI;

      const uri = getMongoDbUri();

      expect(uri).toMatch(/^mongodb:\/\//);
    });
  });
});
