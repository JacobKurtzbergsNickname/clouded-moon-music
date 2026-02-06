import { Inject, Injectable } from "@nestjs/common";
import { Result, err, ResultAsync } from "neverthrow";
import { CMLogger, ILogEntry } from "../common/logger";
import { RedisService } from "../redis/redis.service";
import { CACHE_KEYS, CACHE_TTL } from "../redis/redis.constants";
import {
  ArtistsRepository,
  ARTISTS_REPOSITORY,
} from "./repositories/artists.repository";
import { Artist } from "./models/artist.entity";

@Injectable()
export class ArtistsService {
  private readonly logger: CMLogger;

  constructor(
    @Inject(ARTISTS_REPOSITORY)
    private readonly artistsRepository: ArtistsRepository,
    logger: CMLogger,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger;
  }

  private parseJson<T>(cached: string, cacheKey: string): Result<T, Error> {
    return Result.fromThrowable(
      () => JSON.parse(cached) as T,
      (error) =>
        new Error(
          `Cache data corrupted for key ${cacheKey}: ${error instanceof Error ? error.message : String(error)}`,
        ),
    )();
  }

  private async getCachedArtists(
    cacheKey: string,
  ): Promise<Result<Artist[], Error>> {
    return ResultAsync.fromPromise(
      this.redisService.get(cacheKey),
      (error) => error as Error,
    ).andThen((cached) => {
      if (!cached) {
        return err(new Error("Cache miss"));
      }
      return this.parseJson<Artist[]>(cached, cacheKey);
    });
  }

  private async getCachedArtist(
    cacheKey: string,
  ): Promise<Result<Artist, Error>> {
    return ResultAsync.fromPromise(
      this.redisService.get(cacheKey),
      (error) => error as Error,
    ).andThen((cached) => {
      if (!cached) {
        return err(new Error("Cache miss"));
      }
      return this.parseJson<Artist>(cached, cacheKey);
    });
  }

  private async setCached(
    cacheKey: string,
    data: unknown,
    ttl: number,
  ): Promise<Result<"OK", Error>> {
    return ResultAsync.fromPromise(
      this.redisService.set(cacheKey, JSON.stringify(data), ttl),
      (error) => error as Error,
    );
  }

  async findAll(): Promise<Artist[]> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Getting all artists",
      context: "ArtistsService",
    };
    this.logger.info("Method: findAll()", logEntry);

    const cacheKey = CACHE_KEYS.ARTISTS_LIST_ALL;

    // Try cache first
    const cachedResult = await this.getCachedArtists(cacheKey);

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

  async findOne(id: string): Promise<Artist | null> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Finding artist with id: ${id}`,
      context: "ArtistsService",
    };
    this.logger.info("Method: findOne()", logEntry);

    const cacheKey = `${CACHE_KEYS.ARTIST}${id}`;

    // Try cache first
    const cachedResult = await this.getCachedArtist(cacheKey);

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
}
