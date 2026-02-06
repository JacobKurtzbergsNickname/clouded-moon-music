import { Inject, Injectable } from "@nestjs/common";
import { CMLogger, ILogEntry } from "../common/logger";
import { CachedServiceBase } from "../common/cached-service.base";
import { RedisService } from "../redis/redis.service";
import { CACHE_KEYS, CACHE_TTL } from "../redis/redis.constants";
import {
  GenresRepository,
  GENRES_REPOSITORY,
} from "./repositories/genres.repository";
import { GenreDTO } from "./models/genre.dto";

@Injectable()
export class GenresService extends CachedServiceBase {
  constructor(
    @Inject(GENRES_REPOSITORY)
    private readonly genresRepository: GenresRepository,
    logger: CMLogger,
    redisService: RedisService,
  ) {
    super(redisService, logger);
  }

  async findAll(): Promise<GenreDTO[]> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Getting all genres",
      context: "GenresService",
    };
    this.logger.info("Method: findAll()", logEntry);

    const cacheKey = CACHE_KEYS.GENRES_LIST_ALL;

    // Try cache first
    const cachedResult = await this.getCached<GenreDTO[]>(cacheKey);

    if (cachedResult.isOk()) {
      this.logger.info("Cache hit", {
        ...logEntry,
        message: "Cache hit for all genres",
      });
      return cachedResult.value;
    }

    this.logger.warn(
      `Cache read failed, falling back to DB: ${cachedResult.error.message}`,
    );

    // Fetch from repository
    const genres = await this.genresRepository.findAll();

    // Populate cache (fire and forget with logging)
    const cacheWriteResult = await this.setCached(
      cacheKey,
      genres,
      CACHE_TTL.GENRES_LIST_ALL,
    );

    cacheWriteResult.match(
      () =>
        this.logger.info("Cache populated", {
          ...logEntry,
          message: "Cached all genres",
        }),
      (error) => this.logger.warn(`Cache write failed: ${error.message}`),
    );

    return genres;
  }

  async findOne(id: string): Promise<GenreDTO | null> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Finding genre with id: ${id}`,
      context: "GenresService",
    };
    this.logger.info("Method: findOne()", logEntry);

    const cacheKey = `${CACHE_KEYS.GENRE}${id}`;

    // Try cache first
    const cachedResult = await this.getCached<GenreDTO>(cacheKey);

    if (cachedResult.isOk()) {
      this.logger.info("Cache hit", {
        ...logEntry,
        message: `Cache hit for genre ${id}`,
      });
      return cachedResult.value;
    }

    this.logger.warn(
      `Cache read failed, falling back to DB: ${cachedResult.error.message}`,
    );

    // Fetch from repository
    const genre = await this.genresRepository.findOne(id);

    // Populate cache if genre found
    if (genre) {
      const cacheWriteResult = await this.setCached(
        cacheKey,
        genre,
        CACHE_TTL.GENRE,
      );

      cacheWriteResult.match(
        () =>
          this.logger.info("Cache populated", {
            ...logEntry,
            message: `Cached genre ${id}`,
          }),
        (error) => this.logger.warn(`Cache write failed: ${error.message}`),
      );
    }

    return genre;
  }
}
