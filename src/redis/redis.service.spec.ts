import { Test, TestingModule } from "@nestjs/testing";
import Redis from "ioredis";
import { RedisService } from "./redis.service";
import { REDIS_CLIENT } from "./redis.constants";

describe("RedisService", () => {
  let service: RedisService;
  let mockRedisClient: jest.Mocked<Redis>;

  beforeEach(async () => {
    // Create a mock Redis client
    mockRedisClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      scan: jest.fn(),
      quit: jest.fn(),
    } as unknown as jest.Mocked<Redis>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: REDIS_CLIENT,
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getClient", () => {
    it("should return the Redis client", () => {
      const client = service.getClient();
      expect(client).toBe(mockRedisClient);
    });
  });

  describe("get", () => {
    it("should call client.get with the correct key", async () => {
      mockRedisClient.get.mockResolvedValue("value");

      const result = await service.get("test-key");

      expect(mockRedisClient.get).toHaveBeenCalledWith("test-key");
      expect(result).toBe("value");
    });

    it("should return null when key does not exist", async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.get("nonexistent-key");

      expect(result).toBeNull();
    });
  });

  describe("set", () => {
    it("should call client.set without TTL when ttlSeconds is not provided", async () => {
      mockRedisClient.set.mockResolvedValue("OK");

      const result = await service.set("test-key", "test-value");

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        "test-key",
        "test-value",
      );
      expect(result).toBe("OK");
    });

    it("should call client.set with TTL when ttlSeconds is provided", async () => {
      mockRedisClient.set.mockResolvedValue("OK");

      const result = await service.set("test-key", "test-value", 3600);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        "test-key",
        "test-value",
        "EX",
        3600,
      );
      expect(result).toBe("OK");
    });
  });

  describe("del", () => {
    it("should call client.del with single key", async () => {
      mockRedisClient.del.mockResolvedValue(1);

      const result = await service.del("test-key");

      expect(mockRedisClient.del).toHaveBeenCalledWith("test-key");
      expect(result).toBe(1);
    });

    it("should call client.del with multiple keys", async () => {
      mockRedisClient.del.mockResolvedValue(3);

      const result = await service.del("key1", "key2", "key3");

      expect(mockRedisClient.del).toHaveBeenCalledWith("key1", "key2", "key3");
      expect(result).toBe(3);
    });

    it("should return 0 when no keys are deleted", async () => {
      mockRedisClient.del.mockResolvedValue(0);

      const result = await service.del("nonexistent-key");

      expect(result).toBe(0);
    });
  });

  describe("deletePattern", () => {
    it("should use SCAN to find and delete matching keys", async () => {
      // Mock SCAN to return keys in two batches
      mockRedisClient.scan
        .mockResolvedValueOnce(["5", ["key1", "key2"]])
        .mockResolvedValueOnce(["0", ["key3"]]);

      mockRedisClient.del.mockResolvedValue(3);

      const result = await service.deletePattern("test:*");

      // Verify SCAN was called correctly
      expect(mockRedisClient.scan).toHaveBeenCalledTimes(2);
      expect(mockRedisClient.scan).toHaveBeenNthCalledWith(
        1,
        "0",
        "MATCH",
        "test:*",
        "COUNT",
        1000,
      );
      expect(mockRedisClient.scan).toHaveBeenNthCalledWith(
        2,
        "5",
        "MATCH",
        "test:*",
        "COUNT",
        1000,
      );

      // Verify DEL was called with all found keys
      expect(mockRedisClient.del).toHaveBeenCalledWith("key1", "key2", "key3");
      expect(result).toBe(3);
    });

    it("should return 0 when no keys match the pattern", async () => {
      mockRedisClient.scan.mockResolvedValueOnce(["0", []]);

      const result = await service.deletePattern("nonexistent:*");

      expect(mockRedisClient.scan).toHaveBeenCalledTimes(1);
      expect(mockRedisClient.del).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });

    it("should handle multiple SCAN iterations correctly", async () => {
      // Mock SCAN to iterate multiple times before completing
      mockRedisClient.scan
        .mockResolvedValueOnce(["1", ["key1"]])
        .mockResolvedValueOnce(["2", ["key2"]])
        .mockResolvedValueOnce(["3", ["key3"]])
        .mockResolvedValueOnce(["0", []]);

      mockRedisClient.del.mockResolvedValue(3);

      const result = await service.deletePattern("multi:*");

      expect(mockRedisClient.scan).toHaveBeenCalledTimes(4);
      expect(mockRedisClient.del).toHaveBeenCalledWith("key1", "key2", "key3");
      expect(result).toBe(3);
    });
  });

  describe("onModuleDestroy", () => {
    it("should call client.quit when module is destroyed", async () => {
      mockRedisClient.quit.mockResolvedValue("OK");

      await service.onModuleDestroy();

      expect(mockRedisClient.quit).toHaveBeenCalledTimes(1);
    });
  });
});
