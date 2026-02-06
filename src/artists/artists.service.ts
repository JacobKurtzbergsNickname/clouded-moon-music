import { Inject, Injectable } from "@nestjs/common";
import { CMLogger, ILogEntry } from "../common/logger";
import { CachedServiceBase } from "../common/cached-service.base";
import { RedisService } from "../redis/redis.service";
import { CACHE_KEYS, CACHE_TTL } from "../redis/redis.constants";
import {
  ArtistsRepository,
  ARTISTS_REPOSITORY,
} from "./repositories/artists.repository";
import { ArtistDTO } from "./models/artist.dto";

@Injectable()
export class ArtistsService extends CachedServiceBase {
  constructor(
    @Inject(ARTISTS_REPOSITORY)
    private readonly artistsRepository: ArtistsRepository,
    logger: CMLogger,
    redisService: RedisService,
  ) {
    super(redisService, logger);
  }

  async findAll(): Promise<ArtistDTO[]> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Getting all artists",
      context: "ArtistsService",
    };
    this.logger.info("Method: findAll()", logEntry);

    const cacheKey = CACHE_KEYS.ARTISTS_LIST_ALL;

    // Try cache first
    const cachedResult = await this.getCached<ArtistDTO[]>(cacheKey);

    if (cachedResult.isOk()) {
      this.logger.info("Cache hit", {
        ...logEntry,
        message: "Cache hit for all artists",
      });
      return cachedResult.value;
    }

    this.logger.warn(
      `Cache read failed, falling back to DB: ${cachedResult.error.message}`,
    );

    // Fetch from repository
    const artists = await this.artistsRepository.findAll();

    // Populate cache (fire and forget with logging)
    const cacheWriteResult = await this.setCached(
      cacheKey,
      artists,
      CACHE_TTL.ARTISTS_LIST_ALL,
    );

    cacheWriteResult.match(
      () =>
        this.logger.info("Cache populated", {
          ...logEntry,
          message: "Cached all artists",
        }),
      (error) => this.logger.warn(`Cache write failed: ${error.message}`),
    );

    return artists;
  }

  async findOne(id: string): Promise<ArtistDTO | null> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Finding artist with id: ${id}`,
      context: "ArtistsService",
    };
    this.logger.info("Method: findOne()", logEntry);

    const cacheKey = `${CACHE_KEYS.ARTIST}${id}`;

    // Try cache first
    const cachedResult = await this.getCached<ArtistDTO>(cacheKey);

    if (cachedResult.isOk()) {
      this.logger.info("Cache hit", {
        ...logEntry,
        message: `Cache hit for artist ${id}`,
      });
      return cachedResult.value;
    }

    this.logger.warn(
      `Cache read failed, falling back to DB: ${cachedResult.error.message}`,
    );

    // Fetch from repository
    const artist = await this.artistsRepository.findOne(id);

    // Populate cache if artist found
    if (artist) {
      const cacheWriteResult = await this.setCached(
        cacheKey,
        artist,
        CACHE_TTL.ARTIST,
      );

      cacheWriteResult.match(
        () =>
          this.logger.info("Cache populated", {
            ...logEntry,
            message: `Cached artist ${id}`,
          }),
        (error) => this.logger.warn(`Cache write failed: ${error.message}`),
      );
    }

    return artist;
  }

  /**
   * Find multiple artists by IDs using database-level batching.
   * This method bypasses caching to ensure optimal batch query performance.
   * @param ids - Array of artist IDs
   * @returns Array of ArtistDTO or null, in the same order as input IDs
   */
  async findByIds(ids: string[]): Promise<(ArtistDTO | null)[]> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Batch finding ${ids.length} artists`,
      context: "ArtistsService",
    };
    this.logger.info("Method: findByIds()", logEntry);

    return this.artistsRepository.findByIds(ids);
  }
}
