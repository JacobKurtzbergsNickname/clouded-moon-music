import { CachedServiceBase } from "./cached-service.base";
import { CMLogger } from "./logger";
import { RedisService } from "../redis/redis.service";

// Concrete subclass to exercise protected methods
class TestService extends CachedServiceBase {
  constructor(redisService: RedisService, logger: CMLogger) {
    super(redisService, logger);
  }

  callFindOneCached<T>(
    cacheKey: string,
    ttl: number,
    fallback: () => Promise<T | null>,
  ): Promise<T | null> {
    return this.findOneCached(cacheKey, ttl, fallback);
  }
}

describe("CachedServiceBase.findOneCached", () => {
  let service: TestService;
  let mockRedis: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
  };
  let mockLogger: {
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRedis = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue("OK"),
    };
    mockLogger = { info: vi.fn(), warn: vi.fn() };

    service = new TestService(
      mockRedis as unknown as RedisService,
      mockLogger as unknown as CMLogger,
    );
  });

  it("returns cached value on cache hit", async () => {
    const item = { id: "1", name: "test" };
    mockRedis.get.mockResolvedValue(JSON.stringify(item));
    const fallback = vi.fn();

    const result = await service.callFindOneCached("key:1", 300, fallback);

    expect(result).toEqual(item);
    expect(fallback).not.toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith("Cache hit: key:1");
  });

  it("calls fallback and populates cache on cache miss", async () => {
    const item = { id: "1", name: "test" };
    mockRedis.get.mockResolvedValue(null);
    const fallback = vi.fn().mockResolvedValue(item);

    const result = await service.callFindOneCached("key:1", 300, fallback);

    expect(result).toEqual(item);
    expect(fallback).toHaveBeenCalledOnce();
    expect(mockRedis.set).toHaveBeenCalledWith(
      "key:1",
      JSON.stringify(item),
      300,
    );
    expect(mockLogger.info).toHaveBeenCalledWith("Cache populated: key:1");
  });

  it("returns null and skips cache write when fallback returns null", async () => {
    mockRedis.get.mockResolvedValue(null);
    const fallback = vi.fn().mockResolvedValue(null);

    const result = await service.callFindOneCached("key:1", 300, fallback);

    expect(result).toBeNull();
    expect(mockRedis.set).not.toHaveBeenCalled();
  });

  it("falls back to DB when Redis read fails", async () => {
    const item = { id: "1", name: "test" };
    mockRedis.get.mockRejectedValue(new Error("Redis down"));
    const fallback = vi.fn().mockResolvedValue(item);

    const result = await service.callFindOneCached("key:1", 300, fallback);

    expect(result).toEqual(item);
    expect(fallback).toHaveBeenCalledOnce();
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Cache miss for key:1"),
    );
  });

  it("returns item and logs warning when cache write fails", async () => {
    const item = { id: "1", name: "test" };
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockRejectedValue(new Error("Redis write failed"));
    const fallback = vi.fn().mockResolvedValue(item);

    const result = await service.callFindOneCached("key:1", 300, fallback);

    expect(result).toEqual(item);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Cache write failed for key:1"),
    );
  });
});
