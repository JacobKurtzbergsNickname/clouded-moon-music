import { Inject, Injectable } from "@nestjs/common";
import { CMLogger } from "../common/logger";
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
    this.logger.info("Method: findAll()");
    return this.findAllCached(
      CACHE_KEYS.ARTISTS_LIST_ALL,
      CACHE_TTL.ARTISTS_LIST_ALL,
      () => this.artistsRepository.findAll(),
    );
  }

  async findOne(id: string): Promise<ArtistDTO | null> {
    this.logger.info(`Method: findOne(${id})`);
    const cacheKey = `${CACHE_KEYS.ARTIST}${id}`;
    const cachedResult = await this.getCached<ArtistDTO>(cacheKey);

    if (cachedResult.isOk()) {
      this.logger.info(`Cache hit: ${cacheKey}`);
      return cachedResult.value;
    }

    this.logger.warn(
      `Cache miss for ${cacheKey}, falling back to DB: ${cachedResult.error.message}`,
    );

    const artist = await this.artistsRepository.findOne(id);

    if (artist) {
      const cacheWriteResult = await this.setCached(cacheKey, artist, CACHE_TTL.ARTIST);
      cacheWriteResult.match(
        () => this.logger.info(`Cache populated: ${cacheKey}`),
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
    this.logger.info(`Method: findByIds() — batch finding ${ids.length} artists`);
    return this.artistsRepository.findByIds(ids);
  }

  async create(name: string): Promise<ArtistDTO> {
    const artist = await this.artistsRepository.create(name);
    await this.invalidateCache(
      CACHE_KEYS.ARTISTS_LIST_ALL,
    );
    return artist;
  }

  async update(id: string, name: string): Promise<ArtistDTO | null> {
    const artist = await this.artistsRepository.update(id, name);
    if (artist) {
      await Promise.all([
        this.invalidateCache(CACHE_KEYS.ARTISTS_LIST_ALL, `${CACHE_KEYS.ARTIST}${id}`),
      ]);
    }
    return artist;
  }

  async remove(id: string): Promise<string | null> {
    const result = await this.artistsRepository.remove(id);
    if (result) {
      await this.invalidateCache(
        CACHE_KEYS.ARTISTS_LIST_ALL,
        `${CACHE_KEYS.ARTIST}${id}`,
      );
    }
    return result;
  }
}
