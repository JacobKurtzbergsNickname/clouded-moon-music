import { Inject, Injectable } from "@nestjs/common";
import { Result, ok, err, ResultAsync } from "neverthrow";
import { CMLogger, ILogEntry } from "../common/logger";
import { RedisService } from "../redis/redis.service";
import { CACHE_KEYS, CACHE_TTL } from "../redis/redis.constants";
import CreateSongDTO from "./models/create-song.dto";
import {
  SongsRepository,
  SONGS_REPOSITORY,
} from "./repositories/songs.repository";
import { SongDTO } from "./models/song.dto";

@Injectable()
export class SongsService {
  private readonly logger: CMLogger;

  constructor(
    @Inject(SONGS_REPOSITORY) private readonly songsRepository: SongsRepository,
    logger: CMLogger,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger;
  }

  private async getCachedSongs(
    cacheKey: string,
  ): Promise<Result<SongDTO[], Error>> {
    return ResultAsync.fromPromise(
      this.redisService.get(cacheKey),
      (error) => error as Error,
    ).andThen((cached) => {
      if (!cached) {
        return err(new Error("Cache miss"));
      }

      try {
        return ok(JSON.parse(cached));
      } catch (parseError) {
        return err(
          new Error(
            `Cache data corrupted for key ${cacheKey}: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
          ),
        );
      }
    });
  }

  private async getCachedSong(
    cacheKey: string,
  ): Promise<Result<SongDTO, Error>> {
    return ResultAsync.fromPromise(
      this.redisService.get(cacheKey),
      (error) => error as Error,
    ).andThen((cached) => {
      if (!cached) {
        return err(new Error("Cache miss"));
      }

      try {
        return ok(JSON.parse(cached));
      } catch (parseError) {
        return err(
          new Error(
            `Cache data corrupted for key ${cacheKey}: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
          ),
        );
      }
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

  private async invalidateCache(
    ...keys: string[]
  ): Promise<Result<number, Error>> {
    return ResultAsync.fromPromise(
      this.redisService.del(...keys),
      (error) => error as Error,
    );
  }

  private async invalidateCachePattern(
    pattern: string,
  ): Promise<Result<number, Error>> {
    return ResultAsync.fromPromise(
      this.redisService.deletePattern(pattern),
      (error) => error as Error,
    );
  }

  async findAll(): Promise<SongDTO[]> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Getting all songs",
      context: "SongsService",
    };
    this.logger.info("Method: findAll()", logEntry);

    const cacheKey = CACHE_KEYS.SONGS_LIST_ALL;

    // Try cache first
    const cachedResult = await this.getCachedSongs(cacheKey);

    if (cachedResult.isOk()) {
      this.logger.info("Cache hit", {
        ...logEntry,
        message: "Cache hit for all songs",
      });
      return cachedResult.value;
    }

    this.logger.warn(
      `Cache read failed, falling back to DB: ${cachedResult.error.message}`,
    );

    // Fetch from repository
    const songs = await this.songsRepository.findAll();

    // Populate cache (fire and forget with logging)
    const cacheWriteResult = await this.setCached(
      cacheKey,
      songs,
      CACHE_TTL.SONGS_LIST_ALL,
    );

    cacheWriteResult.match(
      () =>
        this.logger.info("Cache populated", {
          ...logEntry,
          message: "Cached all songs",
        }),
      (error) => this.logger.warn(`Cache write failed: ${error.message}`),
    );

    return songs;
  }

  async findOne(id: string): Promise<SongDTO | null> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Finding song with id: ${id}`,
      context: "SongsService",
    };
    this.logger.info("Method: findOne()", logEntry);

    const cacheKey = `${CACHE_KEYS.SONG}${id}`;

    // Try cache first
    const cachedResult = await this.getCachedSong(cacheKey);

    if (cachedResult.isOk()) {
      this.logger.info("Cache hit", {
        ...logEntry,
        message: `Cache hit for song ${id}`,
      });
      return cachedResult.value;
    }

    this.logger.warn(
      `Cache read failed, falling back to DB: ${cachedResult.error.message}`,
    );

    // Fetch from repository
    const song = await this.songsRepository.findOne(id);

    // Populate cache if song found
    if (song) {
      const cacheWriteResult = await this.setCached(
        cacheKey,
        song,
        CACHE_TTL.SONG,
      );

      cacheWriteResult.match(
        () =>
          this.logger.info("Cache populated", {
            ...logEntry,
            message: `Cached song ${id}`,
          }),
        (error) => this.logger.warn(`Cache write failed: ${error.message}`),
      );
    }

    return song;
  }

  async create(dto: CreateSongDTO): Promise<SongDTO> {
    const song = await this.songsRepository.create(dto);

    // Invalidate list caches
    const invalidateResult = await this.invalidateCache(
      CACHE_KEYS.SONGS_LIST_ALL,
    );
    const invalidatePatternResult = await this.invalidateCachePattern(
      `${CACHE_KEYS.SONGS_LIST_FILTERED}*`,
    );

    Result.combine([invalidateResult, invalidatePatternResult]).match(
      () =>
        this.logger.info("Cache invalidated after create", {
          timestamp: new Date().toISOString(),
          level: "info",
          message: "Invalidated list caches after song creation",
          context: "SongsService",
        }),
      (error) =>
        this.logger.warn(`Cache invalidation failed: ${error.message}`),
    );

    return song;
  }

  async update(
    id: string,
    song: Partial<CreateSongDTO>,
  ): Promise<SongDTO | null> {
    const updatedSong = await this.songsRepository.update(id, song);

    if (updatedSong) {
      const cacheKey = `${CACHE_KEYS.SONG}${id}`;
      const invalidateResult = await this.invalidateCache(
        cacheKey,
        CACHE_KEYS.SONGS_LIST_ALL,
      );
      const invalidatePatternResult = await this.invalidateCachePattern(
        `${CACHE_KEYS.SONGS_LIST_FILTERED}*`,
      );

      Result.combine([invalidateResult, invalidatePatternResult]).match(
        () =>
          this.logger.info("Cache invalidated after update", {
            timestamp: new Date().toISOString(),
            level: "info",
            message: `Invalidated caches for song ${id}`,
            context: "SongsService",
          }),
        (error) =>
          this.logger.warn(`Cache invalidation failed: ${error.message}`),
      );
    }

    return updatedSong;
  }

  async replace(id: string, song: CreateSongDTO): Promise<SongDTO | null> {
    const replacedSong = await this.songsRepository.replace(id, song);

    if (replacedSong) {
      const cacheKey = `${CACHE_KEYS.SONG}${id}`;
      const invalidateResult = await this.invalidateCache(
        cacheKey,
        CACHE_KEYS.SONGS_LIST_ALL,
      );
      const invalidatePatternResult = await this.invalidateCachePattern(
        `${CACHE_KEYS.SONGS_LIST_FILTERED}*`,
      );

      Result.combine([invalidateResult, invalidatePatternResult]).match(
        () =>
          this.logger.info("Cache invalidated after replace", {
            timestamp: new Date().toISOString(),
            level: "info",
            message: `Invalidated caches for song ${id}`,
            context: "SongsService",
          }),
        (error) =>
          this.logger.warn(`Cache invalidation failed: ${error.message}`),
      );
    }

    return replacedSong;
  }

  async remove(id: string): Promise<string | null> {
    const result = await this.songsRepository.remove(id);

    if (result) {
      const cacheKey = `${CACHE_KEYS.SONG}${id}`;
      const invalidateResult = await this.invalidateCache(
        cacheKey,
        CACHE_KEYS.SONGS_LIST_ALL,
      );
      const invalidatePatternResult = await this.invalidateCachePattern(
        `${CACHE_KEYS.SONGS_LIST_FILTERED}*`,
      );

      Result.combine([invalidateResult, invalidatePatternResult]).match(
        () =>
          this.logger.info("Cache invalidated after delete", {
            timestamp: new Date().toISOString(),
            level: "info",
            message: `Invalidated caches for song ${id}`,
            context: "SongsService",
          }),
        (error) =>
          this.logger.warn(`Cache invalidation failed: ${error.message}`),
      );
    }

    return result;
  }
}
