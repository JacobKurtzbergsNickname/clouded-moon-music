import { Result, err, ResultAsync } from "neverthrow";
import { RedisService } from "../redis/redis.service";
import { CMLogger } from "./logger";

/**
 * Base class for services that use Redis caching with neverthrow error handling.
 * Provides common cache operations: parsing, getting, setting, and invalidating cached data.
 */
export abstract class CachedServiceBase {
  constructor(
    protected readonly redisService: RedisService,
    protected readonly logger: CMLogger,
  ) {}

  /**
   * Safely parse JSON from cache with error handling.
   * @param cached - The cached JSON string
   * @param cacheKey - The cache key for error context
   * @returns Result containing parsed data or error
   */
  protected parseJson<T>(cached: string, cacheKey: string): Result<T, Error> {
    return Result.fromThrowable(
      () => JSON.parse(cached) as T,
      (error) =>
        new Error(
          `Cache data corrupted for key ${cacheKey}: ${error instanceof Error ? error.message : String(error)}`,
        ),
    )();
  }

  /**
   * Get cached data by key with automatic JSON parsing.
   * @param cacheKey - The cache key to retrieve
   * @returns ResultAsync containing parsed data or error (including cache miss)
   */
  protected async getCached<T>(cacheKey: string): Promise<Result<T, Error>> {
    return ResultAsync.fromPromise(
      this.redisService.get(cacheKey),
      (error) => error as Error,
    ).andThen((cached) => {
      if (!cached) {
        return err(new Error("Cache miss"));
      }
      return this.parseJson<T>(cached, cacheKey);
    });
  }

  /**
   * Set cache data with automatic JSON serialization.
   * @param cacheKey - The cache key to set
   * @param data - The data to cache
   * @param ttl - Time to live in seconds
   * @returns ResultAsync containing "OK" or error
   */
  protected async setCached(
    cacheKey: string,
    data: unknown,
    ttl: number,
  ): Promise<Result<"OK", Error>> {
    return ResultAsync.fromPromise(
      this.redisService.set(cacheKey, JSON.stringify(data), ttl),
      (error) => error as Error,
    );
  }

  /**
   * Invalidate specific cache keys.
   * @param keys - Cache keys to delete
   * @returns ResultAsync containing number of keys deleted or error
   */
  protected async invalidateCache(
    ...keys: string[]
  ): Promise<Result<number, Error>> {
    return ResultAsync.fromPromise(
      this.redisService.del(...keys),
      (error) => error as Error,
    );
  }

  /**
   * Invalidate cache keys matching a pattern.
   * @param pattern - Glob-style pattern to match keys (e.g., "songs:*")
   * @returns ResultAsync containing number of keys deleted or error
   */
  protected async invalidateCachePattern(
    pattern: string,
  ): Promise<Result<number, Error>> {
    return ResultAsync.fromPromise(
      this.redisService.deletePattern(pattern),
      (error) => error as Error,
    );
  }
}
