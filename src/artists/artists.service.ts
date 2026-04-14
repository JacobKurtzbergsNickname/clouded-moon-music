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
    return this.findOneCached(
      `${CACHE_KEYS.ARTIST}${id}`,
      CACHE_TTL.ARTIST,
      () => this.artistsRepository.findOne(id),
    );
  }

  /**
   * Find multiple artists by IDs using database-level batching.
   * This method bypasses caching to ensure optimal batch query performance.
   * @param ids - Array of artist IDs
   * @returns Array of ArtistDTO or null, in the same order as input IDs
   */
  async findByIds(ids: string[]): Promise<(ArtistDTO | null)[]> {
    this.logger.info(
      `Method: findByIds() — batch finding ${ids.length} artists`,
    );
    return this.artistsRepository.findByIds(ids);
  }

  async create(name: string): Promise<ArtistDTO> {
    const artist = await this.artistsRepository.create(name);
    await this.invalidateCache(CACHE_KEYS.ARTISTS_LIST_ALL);
    return artist;
  }

  async update(id: string, name: string): Promise<ArtistDTO | null> {
    const artist = await this.artistsRepository.update(id, name);
    if (artist) {
      await this.invalidateCache(
        CACHE_KEYS.ARTISTS_LIST_ALL,
        `${CACHE_KEYS.ARTIST}${id}`,
      );
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
