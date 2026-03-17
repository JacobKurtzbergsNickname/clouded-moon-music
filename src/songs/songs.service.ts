import { Inject, Injectable } from "@nestjs/common";
import { Result } from "neverthrow";
import { CMLogger, ILogEntry } from "../common/logger";
import { CachedServiceBase } from "../common/cached-service.base";
import { RedisService } from "../redis/redis.service";
import { CACHE_KEYS, CACHE_TTL } from "../redis/redis.constants";
import CreateSongDTO from "./models/create-song.dto";
import {
  SongsRepository,
  SONGS_REPOSITORY,
} from "./repositories/songs.repository";
import { SongDTO } from "./models/song.dto";

@Injectable()
export class SongsService extends CachedServiceBase {
  constructor(
    @Inject(SONGS_REPOSITORY) private readonly songsRepository: SongsRepository,
    logger: CMLogger,
    redisService: RedisService,
  ) {
    super(redisService, logger);
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
    const cachedResult = await this.getCached<SongDTO[]>(cacheKey);

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
    const cachedResult = await this.getCached<SongDTO>(cacheKey);

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

  /**
   * Find songs by artist IDs using database-level batching.
   * This method bypasses caching to ensure optimal batch query performance.
   * @param artistIds - Array of artist IDs to filter by
   * @returns Array of SongDTO objects containing any of the specified artists
   */
  async findByArtistIds(artistIds: string[]): Promise<SongDTO[]> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Finding songs for ${artistIds.length} artists`,
      context: "SongsService",
    };
    this.logger.info("Method: findByArtistIds()", logEntry);

    return this.songsRepository.findByArtistIds(artistIds);
  }

  /**
   * Find songs by album IDs using database-level batching.
   * This method bypasses caching to ensure optimal batch query performance.
   * @param albumIds - Array of album IDs to filter by
   * @returns Array of SongDTO objects belonging to any of the specified albums
   */
  async findByAlbumIds(albumIds: string[]): Promise<SongDTO[]> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Finding songs for ${albumIds.length} albums`,
      context: "SongsService",
    };
    this.logger.info("Method: findByAlbumIds()", logEntry);

    return this.songsRepository.findByAlbumIds(albumIds);
  }

  /**
   * Find songs by genre IDs using database-level batching.
   * This method bypasses caching to ensure optimal batch query performance.
   * @param genreIds - Array of genre IDs to filter by
   * @returns Array of SongDTO objects containing any of the specified genres
   */
  async findByGenreIds(genreIds: string[]): Promise<SongDTO[]> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Finding songs for ${genreIds.length} genres`,
      context: "SongsService",
    };
    this.logger.info("Method: findByGenreIds()", logEntry);

    return this.songsRepository.findByGenreIds(genreIds);
  }

  async create(dto: CreateSongDTO): Promise<SongDTO> {
    const song = await this.songsRepository.create(dto);

    // Invalidate song list caches
    const invalidateResult = await this.invalidateCache(
      CACHE_KEYS.SONGS_LIST_ALL,
    );
    const invalidatePatternResult = await this.invalidateCachePattern(
      `${CACHE_KEYS.SONGS_LIST_FILTERED}*`,
    );

    // Invalidate artist and genre caches since new ones may have been created
    const invalidateArtistsResult = await this.invalidateCache(
      CACHE_KEYS.ARTISTS_LIST_ALL,
    );
    const invalidateGenresResult = await this.invalidateCache(
      CACHE_KEYS.GENRES_LIST_ALL,
    );

    // Invalidate individual artist and genre caches if they exist
    const invalidateArtistPattern = await this.invalidateCachePattern(
      `${CACHE_KEYS.ARTIST}*`,
    );
    const invalidateGenrePattern = await this.invalidateCachePattern(
      `${CACHE_KEYS.GENRE}*`,
    );

    // Invalidate album caches since song count has changed
    const invalidateAlbumsResult = await this.invalidateCache(
      CACHE_KEYS.ALBUMS_LIST_ALL,
    );
    const invalidateAlbumPattern = await this.invalidateCachePattern(
      `${CACHE_KEYS.ALBUM}*`,
    );

    Result.combine([
      invalidateResult,
      invalidatePatternResult,
      invalidateArtistsResult,
      invalidateGenresResult,
      invalidateArtistPattern,
      invalidateGenrePattern,
      invalidateAlbumsResult,
      invalidateAlbumPattern,
    ]).match(
      () =>
        this.logger.info("Cache invalidated after create", {
          timestamp: new Date().toISOString(),
          level: "info",
          message:
            "Invalidated song, artist, genre, and album caches after song creation",
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

      // Invalidate artist and genre caches since relationships may have changed
      const invalidateArtistsResult = await this.invalidateCache(
        CACHE_KEYS.ARTISTS_LIST_ALL,
      );
      const invalidateGenresResult = await this.invalidateCache(
        CACHE_KEYS.GENRES_LIST_ALL,
      );
      const invalidateArtistPattern = await this.invalidateCachePattern(
        `${CACHE_KEYS.ARTIST}*`,
      );
      const invalidateGenrePattern = await this.invalidateCachePattern(
        `${CACHE_KEYS.GENRE}*`,
      );

      // Invalidate album caches since album reference may have changed
      const invalidateAlbumsResult = await this.invalidateCache(
        CACHE_KEYS.ALBUMS_LIST_ALL,
      );
      const invalidateAlbumPattern = await this.invalidateCachePattern(
        `${CACHE_KEYS.ALBUM}*`,
      );

      Result.combine([
        invalidateResult,
        invalidatePatternResult,
        invalidateArtistsResult,
        invalidateGenresResult,
        invalidateArtistPattern,
        invalidateGenrePattern,
        invalidateAlbumsResult,
        invalidateAlbumPattern,
      ]).match(
        () =>
          this.logger.info("Cache invalidated after update", {
            timestamp: new Date().toISOString(),
            level: "info",
            message: `Invalidated caches for song ${id} and related entities`,
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

      // Invalidate artist and genre caches since relationships may have changed
      const invalidateArtistsResult = await this.invalidateCache(
        CACHE_KEYS.ARTISTS_LIST_ALL,
      );
      const invalidateGenresResult = await this.invalidateCache(
        CACHE_KEYS.GENRES_LIST_ALL,
      );
      const invalidateArtistPattern = await this.invalidateCachePattern(
        `${CACHE_KEYS.ARTIST}*`,
      );
      const invalidateGenrePattern = await this.invalidateCachePattern(
        `${CACHE_KEYS.GENRE}*`,
      );

      // Invalidate album caches since album reference may have changed
      const invalidateAlbumsResult = await this.invalidateCache(
        CACHE_KEYS.ALBUMS_LIST_ALL,
      );
      const invalidateAlbumPattern = await this.invalidateCachePattern(
        `${CACHE_KEYS.ALBUM}*`,
      );

      Result.combine([
        invalidateResult,
        invalidatePatternResult,
        invalidateArtistsResult,
        invalidateGenresResult,
        invalidateArtistPattern,
        invalidateGenrePattern,
        invalidateAlbumsResult,
        invalidateAlbumPattern,
      ]).match(
        () =>
          this.logger.info("Cache invalidated after replace", {
            timestamp: new Date().toISOString(),
            level: "info",
            message: `Invalidated caches for song ${id} and related entities`,
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

      // Invalidate artist and genre caches since song count has changed
      const invalidateArtistsResult = await this.invalidateCache(
        CACHE_KEYS.ARTISTS_LIST_ALL,
      );
      const invalidateGenresResult = await this.invalidateCache(
        CACHE_KEYS.GENRES_LIST_ALL,
      );
      const invalidateArtistPattern = await this.invalidateCachePattern(
        `${CACHE_KEYS.ARTIST}*`,
      );
      const invalidateGenrePattern = await this.invalidateCachePattern(
        `${CACHE_KEYS.GENRE}*`,
      );

      // Invalidate album caches since song count has changed
      const invalidateAlbumsResult = await this.invalidateCache(
        CACHE_KEYS.ALBUMS_LIST_ALL,
      );
      const invalidateAlbumPattern = await this.invalidateCachePattern(
        `${CACHE_KEYS.ALBUM}*`,
      );

      Result.combine([
        invalidateResult,
        invalidatePatternResult,
        invalidateArtistsResult,
        invalidateGenresResult,
        invalidateArtistPattern,
        invalidateGenrePattern,
        invalidateAlbumsResult,
        invalidateAlbumPattern,
      ]).match(
        () =>
          this.logger.info("Cache invalidated after delete", {
            timestamp: new Date().toISOString(),
            level: "info",
            message: `Invalidated caches for song ${id} and related entities`,
            context: "SongsService",
          }),
        (error) =>
          this.logger.warn(`Cache invalidation failed: ${error.message}`),
      );
    }

    return result;
  }
}
