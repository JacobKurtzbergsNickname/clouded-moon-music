import { Inject, Injectable } from "@nestjs/common";
import { CachedServiceBase } from "../common/cached-service.base";
import { CMLogger, ILogEntry } from "../common/logger";
import { RedisService } from "../redis/redis.service";
import { CACHE_KEYS, CACHE_TTL } from "../redis/redis.constants";
import { StorageService, SignedUrlResult } from "../storage/storage.service";
import { TRACKS_REPOSITORY, TracksRepository } from "./repositories/tracks.repository";
import { TrackDTO } from "./models/track.dto";
import { CreateTrackDTO } from "./models/create-track.dto";

@Injectable()
export class TracksService extends CachedServiceBase {
  constructor(
    @Inject(TRACKS_REPOSITORY) private readonly tracksRepository: TracksRepository,
    private readonly storageService: StorageService,
    logger: CMLogger,
    redisService: RedisService,
  ) {
    super(redisService, logger);
  }

  async findAll(): Promise<TrackDTO[]> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Getting all tracks",
      context: "TracksService",
    };
    this.logger.info("Method: findAll()", logEntry);

    const cacheKey = CACHE_KEYS.TRACKS_LIST_ALL;
    const cachedResult = await this.getCached<TrackDTO[]>(cacheKey);

    if (cachedResult.isOk()) {
      this.logger.info("Cache hit for all tracks", logEntry);
      return cachedResult.value;
    }

    this.logger.warn(
      `Cache read failed, falling back to DB: ${cachedResult.error.message}`,
    );

    const tracks = await this.tracksRepository.findAll();

    const cacheWriteResult = await this.setCached(
      cacheKey,
      tracks,
      CACHE_TTL.TRACKS_LIST_ALL,
    );

    cacheWriteResult.match(
      () => this.logger.info("Cached all tracks", logEntry),
      (error) => this.logger.warn(`Cache write failed: ${error.message}`),
    );

    return tracks;
  }

  async findOne(id: string): Promise<TrackDTO | null> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Finding track ${id}`,
      context: "TracksService",
    };
    this.logger.info("Method: findOne()", logEntry);

    const cacheKey = `${CACHE_KEYS.TRACK}${id}`;
    const cachedResult = await this.getCached<TrackDTO>(cacheKey);

    if (cachedResult.isOk()) {
      this.logger.info(`Cache hit for track ${id}`, logEntry);
      return cachedResult.value;
    }

    this.logger.warn(
      `Cache read failed, falling back to DB: ${cachedResult.error.message}`,
    );

    const track = await this.tracksRepository.findOne(id);

    if (track) {
      const cacheWriteResult = await this.setCached(
        cacheKey,
        track,
        CACHE_TTL.TRACK,
      );

      cacheWriteResult.match(
        () => this.logger.info(`Cached track ${id}`, logEntry),
        (error) => this.logger.warn(`Cache write failed: ${error.message}`),
      );
    }

    return track;
  }

  async create(dto: CreateTrackDTO): Promise<TrackDTO> {
    const track = await this.tracksRepository.create(dto);

    const invalidateResult = await this.invalidateCache(CACHE_KEYS.TRACKS_LIST_ALL);
    invalidateResult.match(
      () =>
        this.logger.info("Invalidated tracks list cache after create", {
          timestamp: new Date().toISOString(),
          level: "info",
          message: "Cache invalidated",
          context: "TracksService",
        }),
      (error) => this.logger.warn(`Cache invalidation failed: ${error.message}`),
    );

    return track;
  }

  async remove(id: string): Promise<string | null> {
    const result = await this.tracksRepository.remove(id);

    if (result) {
      const cacheKey = `${CACHE_KEYS.TRACK}${id}`;
      const invalidateResult = await this.invalidateCache(
        cacheKey,
        CACHE_KEYS.TRACKS_LIST_ALL,
      );
      invalidateResult.match(
        () =>
          this.logger.info(`Invalidated caches for track ${id}`, {
            timestamp: new Date().toISOString(),
            level: "info",
            message: "Cache invalidated",
            context: "TracksService",
          }),
        (error) => this.logger.warn(`Cache invalidation failed: ${error.message}`),
      );
    }

    return result;
  }

  /**
   * Return a signed URL authorising the client to stream the requested track
   * directly from object storage (or the local dev endpoint).
   */
  async getPlayUrl(id: string): Promise<{ streamUrl: string; expiresAt: Date } | null> {
    const track = await this.findOne(id);
    if (!track) return null;

    const signed: SignedUrlResult = this.storageService.getSignedDownloadUrl(
      track.storageKey,
      id,
    );

    return { streamUrl: signed.url, expiresAt: signed.expiresAt };
  }

  /**
   * Return a signed upload URL so the client can PUT an audio file directly
   * to object storage without routing large payloads through NestJS.
   */
  getUploadUrl(storageKey: string): SignedUrlResult {
    return this.storageService.getSignedUploadUrl(storageKey);
  }
}
