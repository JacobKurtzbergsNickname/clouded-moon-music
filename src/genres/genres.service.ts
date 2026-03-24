import { Inject, Injectable } from "@nestjs/common";
import { CMLogger } from "../common/logger";
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
    this.logger.info("Method: findAll()");
    return this.findAllCached(
      CACHE_KEYS.GENRES_LIST_ALL,
      CACHE_TTL.GENRES_LIST_ALL,
      () => this.genresRepository.findAll(),
    );
  }

  async findOne(id: string): Promise<GenreDTO | null> {
    this.logger.info(`Method: findOne(${id})`);
    const cacheKey = `${CACHE_KEYS.GENRE}${id}`;
    const cachedResult = await this.getCached<GenreDTO>(cacheKey);

    if (cachedResult.isOk()) {
      this.logger.info(`Cache hit: ${cacheKey}`);
      return cachedResult.value;
    }

    this.logger.warn(
      `Cache miss for ${cacheKey}, falling back to DB: ${cachedResult.error.message}`,
    );

    const genre = await this.genresRepository.findOne(id);

    if (genre) {
      const cacheWriteResult = await this.setCached(
        cacheKey,
        genre,
        CACHE_TTL.GENRE,
      );
      cacheWriteResult.match(
        () => this.logger.info(`Cache populated: ${cacheKey}`),
        (error) => this.logger.warn(`Cache write failed: ${error.message}`),
      );
    }

    return genre;
  }

  /**
   * Find multiple genres by IDs using database-level batching.
   * This method bypasses caching to ensure optimal batch query performance.
   * @param ids - Array of genre IDs
   * @returns Array of GenreDTO or null, in the same order as input IDs
   */
  async findByIds(ids: string[]): Promise<(GenreDTO | null)[]> {
    this.logger.info(
      `Method: findByIds() — batch finding ${ids.length} genres`,
    );
    return this.genresRepository.findByIds(ids);
  }

  async create(name: string): Promise<GenreDTO> {
    const genre = await this.genresRepository.create(name);
    await this.invalidateCache(CACHE_KEYS.GENRES_LIST_ALL);
    return genre;
  }

  async update(id: string, name: string): Promise<GenreDTO | null> {
    const genre = await this.genresRepository.update(id, name);
    if (genre) {
      await Promise.all([
        this.invalidateCache(
          CACHE_KEYS.GENRES_LIST_ALL,
          `${CACHE_KEYS.GENRE}${id}`,
        ),
      ]);
    }
    return genre;
  }

  async remove(id: string): Promise<string | null> {
    const result = await this.genresRepository.remove(id);
    if (result) {
      await this.invalidateCache(
        CACHE_KEYS.GENRES_LIST_ALL,
        `${CACHE_KEYS.GENRE}${id}`,
      );
    }
    return result;
  }
}
