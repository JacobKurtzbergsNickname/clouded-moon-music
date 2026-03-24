import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { Result } from "neverthrow";
import { CMLogger } from "../common/logger";
import { ILogEntry } from "../common/logger/interfaces/log.interface";
import { CachedServiceBase } from "../common/cached-service.base";
import { RedisService } from "../redis/redis.service";
import { CACHE_KEYS, CACHE_TTL } from "../redis/redis.constants";
import CreateSongDTO from "./models/create-song.dto";
import {
  SongsRepository,
  SONGS_REPOSITORY,
} from "./repositories/songs.repository";
import { SongDTO } from "./models/song.dto";
import { ArtistsService } from "../artists/artists.service";
import { GenresService } from "../genres/genres.service";

@Injectable()
export class SongsService extends CachedServiceBase {
  constructor(
    @Inject(SONGS_REPOSITORY) private readonly songsRepository: SongsRepository,
    private readonly artistsService: ArtistsService,
    private readonly genresService: GenresService,
    logger: CMLogger,
    redisService: RedisService,
  ) {
    super(redisService, logger);
  }

  /**
   * Validate that all referenced artist and genre IDs exist in the database.
   * Throws BadRequestException if any IDs are not found.
   */
  private async validateReferences(
    artistIds?: string[],
    genreIds?: string[],
  ): Promise<void> {
    if (artistIds && artistIds.length > 0) {
      const artists = await this.artistsService.findByIds(artistIds);
      const missingArtists = artistIds.filter((_, i) => artists[i] === null);
      if (missingArtists.length > 0) {
        throw new BadRequestException(
          `Artist IDs not found: ${missingArtists.join(", ")}`,
        );
      }
    }

    if (genreIds && genreIds.length > 0) {
      const genres = await this.genresService.findByIds(genreIds);
      const missingGenres = genreIds.filter((_, i) => genres[i] === null);
      if (missingGenres.length > 0) {
        throw new BadRequestException(
          `Genre IDs not found: ${missingGenres.join(", ")}`,
        );
      }
    }
  }

  async findAll(): Promise<SongDTO[]> {
    this.logger.info("Method: findAll()");
    return this.findAllCached(
      CACHE_KEYS.SONGS_LIST_ALL,
      CACHE_TTL.SONGS_LIST_ALL,
      () => this.songsRepository.findAll(),
    );
  }

  async findOne(id: string): Promise<SongDTO | null> {
    this.logger.info(`Method: findOne(${id})`);
    const cacheKey = `${CACHE_KEYS.SONG}${id}`;
    const cachedResult = await this.getCached<SongDTO>(cacheKey);

    if (cachedResult.isOk()) {
      this.logger.info(`Cache hit: ${cacheKey}`);
      return cachedResult.value;
    }

    this.logger.warn(
      `Cache miss for ${cacheKey}, falling back to DB: ${cachedResult.error.message}`,
    );

    const song = await this.songsRepository.findOne(id);

    if (song) {
      const cacheWriteResult = await this.setCached(
        cacheKey,
        song,
        CACHE_TTL.SONG,
      );
      cacheWriteResult.match(
        () => this.logger.info(`Cache populated: ${cacheKey}`),
        (error) => this.logger.warn(`Cache write failed: ${error.message}`),
      );
    }

    return song;
  }

  /**
   * Find multiple songs by IDs using database-level batching.
   * This method bypasses caching to ensure optimal batch query performance.
   * @param ids - Array of song IDs
   * @returns Array of SongDTO or null in the same order as input IDs
   */
  async findByIds(ids: string[]): Promise<(SongDTO | null)[]> {
    this.logger.info(`Method: findByIds() — batch finding ${ids.length} songs`);
    return this.songsRepository.findByIds(ids);
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
    await this.validateReferences(dto.artists, dto.genres);
    const song = await this.songsRepository.create(dto);
    await this.invalidateSongCaches();
    return song;
  }

  async update(
    id: string,
    song: Partial<CreateSongDTO>,
  ): Promise<SongDTO | null> {
    await this.validateReferences(song.artists, song.genres);
    const updatedSong = await this.songsRepository.update(id, song);
    if (updatedSong) {
      await this.invalidateSongCaches(`${CACHE_KEYS.SONG}${id}`);
    }
    return updatedSong;
  }

  async replace(id: string, song: CreateSongDTO): Promise<SongDTO | null> {
    await this.validateReferences(song.artists, song.genres);
    const replacedSong = await this.songsRepository.replace(id, song);
    if (replacedSong) {
      await this.invalidateSongCaches(`${CACHE_KEYS.SONG}${id}`);
    }
    return replacedSong;
  }

  async remove(id: string): Promise<string | null> {
    const result = await this.songsRepository.remove(id);
    if (result) {
      await this.invalidateSongCaches(`${CACHE_KEYS.SONG}${id}`);
    }
    return result;
  }

  /**
   * Invalidate all caches affected by a song mutation in parallel.
   * @param extraKeys - Additional specific cache keys to invalidate (e.g., individual song key)
   */
  private async invalidateSongCaches(...extraKeys: string[]): Promise<void> {
    const results = await Promise.all([
      this.invalidateCache(
        CACHE_KEYS.SONGS_LIST_ALL,
        CACHE_KEYS.ARTISTS_LIST_ALL,
        CACHE_KEYS.GENRES_LIST_ALL,
        ...extraKeys,
      ),
      this.invalidateCachePattern(`${CACHE_KEYS.SONGS_LIST_FILTERED}*`),
      this.invalidateCachePattern(`${CACHE_KEYS.ARTIST}*`),
      this.invalidateCachePattern(`${CACHE_KEYS.GENRE}*`),
    ]);

    Result.combine(results).match(
      () => this.logger.info("Song mutation caches invalidated"),
      (error) =>
        this.logger.warn(`Cache invalidation failed: ${error.message}`),
    );
  }
}
