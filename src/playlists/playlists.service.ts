import { Inject, Injectable } from "@nestjs/common";
import { Result } from "neverthrow";
import { CMLogger, ILogEntry } from "../common/logger";
import { CachedServiceBase } from "../common/cached-service.base";
import { RedisService } from "../redis/redis.service";
import { CACHE_KEYS, CACHE_TTL } from "../redis/redis.constants";
import { CreatePlaylistDTO } from "./models/create-playlist.dto";
import { PlaylistDTO } from "./models/playlist.dto";
import {
  PlaylistsRepository,
  PLAYLISTS_REPOSITORY,
} from "./repositories/playlists.repository";

@Injectable()
export class PlaylistsService extends CachedServiceBase {
  constructor(
    @Inject(PLAYLISTS_REPOSITORY)
    private readonly playlistsRepository: PlaylistsRepository,
    logger: CMLogger,
    redisService: RedisService,
  ) {
    super(redisService, logger);
  }

  async findAll(): Promise<PlaylistDTO[]> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Getting all playlists",
      context: "PlaylistsService",
    };
    this.logger.info("Method: findAll()", logEntry);

    const cacheKey = CACHE_KEYS.PLAYLISTS_LIST_ALL;
    const cachedResult = await this.getCached<PlaylistDTO[]>(cacheKey);

    if (cachedResult.isOk()) {
      this.logger.info("Cache hit", {
        ...logEntry,
        message: "Cache hit for all playlists",
      });
      return cachedResult.value;
    }

    this.logger.warn(
      `Cache read failed, falling back to DB: ${cachedResult.error.message}`,
    );

    const playlists = await this.playlistsRepository.findAll();

    const cacheWriteResult = await this.setCached(
      cacheKey,
      playlists,
      CACHE_TTL.PLAYLISTS_LIST_ALL,
    );

    cacheWriteResult.match(
      () =>
        this.logger.info("Cache populated", {
          ...logEntry,
          message: "Cached all playlists",
        }),
      (error) => this.logger.warn(`Cache write failed: ${error.message}`),
    );

    return playlists;
  }

  async findOne(id: string): Promise<PlaylistDTO | null> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Finding playlist with id: ${id}`,
      context: "PlaylistsService",
    };
    this.logger.info("Method: findOne()", logEntry);

    const cacheKey = `${CACHE_KEYS.PLAYLIST}${id}`;
    const cachedResult = await this.getCached<PlaylistDTO>(cacheKey);

    if (cachedResult.isOk()) {
      this.logger.info("Cache hit", {
        ...logEntry,
        message: `Cache hit for playlist ${id}`,
      });
      return cachedResult.value;
    }

    this.logger.warn(
      `Cache read failed, falling back to DB: ${cachedResult.error.message}`,
    );

    const playlist = await this.playlistsRepository.findOne(id);

    if (playlist) {
      const cacheWriteResult = await this.setCached(
        cacheKey,
        playlist,
        CACHE_TTL.PLAYLIST,
      );

      cacheWriteResult.match(
        () =>
          this.logger.info("Cache populated", {
            ...logEntry,
            message: `Cached playlist ${id}`,
          }),
        (error) => this.logger.warn(`Cache write failed: ${error.message}`),
      );
    }

    return playlist;
  }

  /**
   * Find playlists by IDs using database-level batching.
   * Bypasses caching to let DataLoader batching work optimally.
   */
  async findByIds(ids: string[]): Promise<(PlaylistDTO | null)[]> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Finding ${ids.length} playlists by IDs`,
      context: "PlaylistsService",
    };
    this.logger.info("Method: findByIds()", logEntry);

    return this.playlistsRepository.findByIds(ids);
  }

  async create(dto: CreatePlaylistDTO): Promise<PlaylistDTO> {
    const playlist = await this.playlistsRepository.create(dto);

    const invalidateResult = await this.invalidateCache(
      CACHE_KEYS.PLAYLISTS_LIST_ALL,
    );

    invalidateResult.match(
      () =>
        this.logger.info("Cache invalidated after create", {
          timestamp: new Date().toISOString(),
          level: "info",
          message: "Invalidated playlists list cache after creation",
          context: "PlaylistsService",
        }),
      (error) =>
        this.logger.warn(`Cache invalidation failed: ${error.message}`),
    );

    return playlist;
  }

  async update(
    id: string,
    dto: Partial<CreatePlaylistDTO>,
  ): Promise<PlaylistDTO | null> {
    const updated = await this.playlistsRepository.update(id, dto);

    if (updated) {
      const cacheKey = `${CACHE_KEYS.PLAYLIST}${id}`;
      const invalidateResult = await this.invalidateCache(
        cacheKey,
        CACHE_KEYS.PLAYLISTS_LIST_ALL,
      );

      invalidateResult.match(
        () =>
          this.logger.info("Cache invalidated after update", {
            timestamp: new Date().toISOString(),
            level: "info",
            message: `Invalidated caches for playlist ${id}`,
            context: "PlaylistsService",
          }),
        (error) =>
          this.logger.warn(`Cache invalidation failed: ${error.message}`),
      );
    }

    return updated;
  }

  async remove(id: string): Promise<string | null> {
    const result = await this.playlistsRepository.remove(id);

    if (result) {
      const cacheKey = `${CACHE_KEYS.PLAYLIST}${id}`;
      const invalidateResult = await this.invalidateCache(
        cacheKey,
        CACHE_KEYS.PLAYLISTS_LIST_ALL,
      );

      invalidateResult.match(
        () =>
          this.logger.info("Cache invalidated after delete", {
            timestamp: new Date().toISOString(),
            level: "info",
            message: `Invalidated caches for playlist ${id}`,
            context: "PlaylistsService",
          }),
        (error) =>
          this.logger.warn(`Cache invalidation failed: ${error.message}`),
      );
    }

    return result;
  }

  async addSong(id: string, songId: string): Promise<PlaylistDTO | null> {
    const playlist = await this.playlistsRepository.addSong(id, songId);

    if (playlist) {
      const cacheKey = `${CACHE_KEYS.PLAYLIST}${id}`;
      const invalidateResult = await this.invalidateCache(
        cacheKey,
        CACHE_KEYS.PLAYLISTS_LIST_ALL,
      );

      invalidateResult.match(
        () =>
          this.logger.info("Cache invalidated after addSong", {
            timestamp: new Date().toISOString(),
            level: "info",
            message: `Invalidated caches for playlist ${id} after adding song`,
            context: "PlaylistsService",
          }),
        (error) =>
          this.logger.warn(`Cache invalidation failed: ${error.message}`),
      );
    }

    return playlist;
  }

  async removeSong(id: string, songId: string): Promise<PlaylistDTO | null> {
    const playlist = await this.playlistsRepository.removeSong(id, songId);

    if (playlist) {
      const cacheKey = `${CACHE_KEYS.PLAYLIST}${id}`;
      const invalidateResult = await this.invalidateCache(
        cacheKey,
        CACHE_KEYS.PLAYLISTS_LIST_ALL,
      );

      Result.combine([invalidateResult]).match(
        () =>
          this.logger.info("Cache invalidated after removeSong", {
            timestamp: new Date().toISOString(),
            level: "info",
            message: `Invalidated caches for playlist ${id} after removing song`,
            context: "PlaylistsService",
          }),
        (error) =>
          this.logger.warn(`Cache invalidation failed: ${error.message}`),
      );
    }

    return playlist;
  }
}
