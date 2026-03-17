import { Inject, Injectable } from "@nestjs/common";
import { CMLogger, ILogEntry } from "../common/logger";
import { CachedServiceBase } from "../common/cached-service.base";
import { RedisService } from "../redis/redis.service";
import { CACHE_KEYS, CACHE_TTL } from "../redis/redis.constants";
import {
  AlbumsRepository,
  ALBUMS_REPOSITORY,
} from "./repositories/albums.repository";
import { AlbumDTO } from "./models/album.dto";

@Injectable()
export class AlbumsService extends CachedServiceBase {
  constructor(
    @Inject(ALBUMS_REPOSITORY)
    private readonly albumsRepository: AlbumsRepository,
    logger: CMLogger,
    redisService: RedisService,
  ) {
    super(redisService, logger);
  }

  async findAll(): Promise<AlbumDTO[]> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Getting all albums",
      context: "AlbumsService",
    };
    this.logger.info("Method: findAll()", logEntry);

    const cacheKey = CACHE_KEYS.ALBUMS_LIST_ALL;

    const cachedResult = await this.getCached<AlbumDTO[]>(cacheKey);

    if (cachedResult.isOk()) {
      this.logger.info("Cache hit", {
        ...logEntry,
        message: "Cache hit for all albums",
      });
      return cachedResult.value;
    }

    this.logger.warn(
      `Cache read failed, falling back to DB: ${cachedResult.error.message}`,
    );

    const albums = await this.albumsRepository.findAll();

    const cacheWriteResult = await this.setCached(
      cacheKey,
      albums,
      CACHE_TTL.ALBUMS_LIST_ALL,
    );

    cacheWriteResult.match(
      () =>
        this.logger.info("Cache populated", {
          ...logEntry,
          message: "Cached all albums",
        }),
      (error) => this.logger.warn(`Cache write failed: ${error.message}`),
    );

    return albums;
  }

  async findOne(id: string): Promise<AlbumDTO | null> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Finding album with id: ${id}`,
      context: "AlbumsService",
    };
    this.logger.info("Method: findOne()", logEntry);

    const cacheKey = `${CACHE_KEYS.ALBUM}${id}`;

    const cachedResult = await this.getCached<AlbumDTO>(cacheKey);

    if (cachedResult.isOk()) {
      this.logger.info("Cache hit", {
        ...logEntry,
        message: `Cache hit for album ${id}`,
      });
      return cachedResult.value;
    }

    this.logger.warn(
      `Cache read failed, falling back to DB: ${cachedResult.error.message}`,
    );

    const album = await this.albumsRepository.findOne(id);

    if (album) {
      const cacheWriteResult = await this.setCached(
        cacheKey,
        album,
        CACHE_TTL.ALBUM,
      );

      cacheWriteResult.match(
        () =>
          this.logger.info("Cache populated", {
            ...logEntry,
            message: `Cached album ${id}`,
          }),
        (error) => this.logger.warn(`Cache write failed: ${error.message}`),
      );
    }

    return album;
  }

  /**
   * Find multiple albums by IDs using database-level batching.
   * This method bypasses caching to ensure optimal batch query performance.
   * @param ids - Array of album IDs
   * @returns Array of AlbumDTO or null, in the same order as input IDs
   */
  async findByIds(ids: string[]): Promise<(AlbumDTO | null)[]> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Batch finding ${ids.length} albums`,
      context: "AlbumsService",
    };
    this.logger.info("Method: findByIds()", logEntry);

    return this.albumsRepository.findByIds(ids);
  }
}
