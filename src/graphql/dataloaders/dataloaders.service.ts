import { Injectable, Scope } from "@nestjs/common";
import DataLoader from "dataloader";
import { ArtistType } from "../models/artist.type";
import { GenreType } from "../models/genre.type";
import { PlaylistType } from "../models/playlist.type";
import { SongType, SongRawGqlType } from "../models/song.type";
import { ArtistsService } from "../../artists/artists.service";
import { GenresService } from "../../genres/genres.service";
import { SongsService } from "../../songs/songs.service";
import { PlaylistsService } from "../../playlists/playlists.service";

/**
 * Request-scoped service providing DataLoader instances for batch loading entities.
 * Prevents N+1 query problems by batching and caching entity lookups within a single request.
 *
 * This implementation uses true database-level batching via repository methods:
 * - artistLoader/genreLoader: Uses findByIds() with SQL IN clause
 * - songsByArtistLoader/songsByGenreLoader: Uses findByArtistIds()/findByGenreIds() with MongoDB $in operator
 *
 * Each DataLoader executes a single optimized database query per batch instead of N individual queries.
 */
@Injectable({ scope: Scope.REQUEST })
export class DataLoadersService {
  constructor(
    private readonly artistsService: ArtistsService,
    private readonly genresService: GenresService,
    private readonly songsService: SongsService,
    private readonly playlistsService: PlaylistsService,
  ) {}

  /**
   * DataLoader for batching artist lookups by ID.
   * Caches results per-request to avoid duplicate fetches.
   * Uses database-level batch query via findByIds for optimal performance.
   */
  readonly artistLoader = new DataLoader<string, ArtistType | null>(
    async (ids: readonly string[]) => {
      // Single database query with IN clause
      const artists = await this.artistsService.findByIds(Array.from(ids));

      // Convert DTOs to GraphQL types
      return artists.map((artist) => {
        if (!artist) return null;
        return {
          id: String(artist.id),
          name: artist.name,
        } as ArtistType;
      });
    },
  );

  /**
   * DataLoader for batching genre lookups by ID.
   * Caches results per-request to avoid duplicate fetches.
   * Uses database-level batch query via findByIds for optimal performance.
   */
  readonly genreLoader = new DataLoader<string, GenreType | null>(
    async (ids: readonly string[]) => {
      // Single database query with IN clause
      const genres = await this.genresService.findByIds(Array.from(ids));

      // Convert DTOs to GraphQL types
      return genres.map((genre) => {
        if (!genre) return null;
        return {
          id: String(genre.id),
          name: genre.name,
        } as GenreType;
      });
    },
  );

  /**
   * DataLoader for batching song lookups by ID.
   * Caches results per-request to avoid duplicate fetches.
   * Uses database-level batch query via findByIds for optimal performance.
   */
  readonly songLoader = new DataLoader<string, SongType | null>(
    async (ids: readonly string[]) => {
      // Single database query with $in operator — no N+1
      const songs = await this.songsService.findByIds(Array.from(ids));
      return songs.map((song) => (song ? (song as unknown as SongType) : null));
    },
  );

  /**
   * DataLoader for batching songs by artist ID.
   * Fetches all songs for given artists using database-level batching.
   */
  readonly songsByArtistLoader = new DataLoader<string, SongRawGqlType[]>(
    async (artistIds: readonly string[]) => {
      // Single database query with $in operator
      const songs = await this.songsService.findByArtistIds(
        Array.from(artistIds),
      );

      // Build a lookup map from artist ID to songs
      const songsByArtistId = new Map<string, SongRawGqlType[]>();

      for (const song of songs) {
        if (!song.artists || !Array.isArray(song.artists)) {
          continue;
        }
        for (const artistId of song.artists) {
          const key = String(artistId);
          const bucket = songsByArtistId.get(key);
          if (bucket) {
            bucket.push(song);
          } else {
            songsByArtistId.set(key, [song]);
          }
        }
      }

      // Return results in the same order as the requested artist IDs
      return artistIds.map((artistId) => songsByArtistId.get(artistId) ?? []);
    },
  );

  /**
   * DataLoader for batching playlist lookups by ID.
   * Caches results per-request to avoid duplicate fetches.
   * Uses database-level batch query via findByIds for optimal performance.
   */
  readonly playlistLoader = new DataLoader<string, PlaylistType | null>(
    async (ids: readonly string[]) => {
      const playlists = await this.playlistsService.findByIds(Array.from(ids));
      return playlists.map((playlist) => {
        if (!playlist) return null;
        return playlist as unknown as PlaylistType;
      });
    },
  );

  /**
   * DataLoader for batching songs by genre ID.
   * Fetches all songs for given genres using database-level batching.
   */
  readonly songsByGenreLoader = new DataLoader<string, SongRawGqlType[]>(
    async (genreIds: readonly string[]) => {
      // Single database query with $in operator
      const songs = await this.songsService.findByGenreIds(
        Array.from(genreIds),
      );

      // Build a lookup map from genre ID to songs
      const songsByGenreId = new Map<string, SongRawGqlType[]>();

      for (const song of songs) {
        if (!song.genres || !Array.isArray(song.genres)) {
          continue;
        }
        for (const genreId of song.genres) {
          const key = String(genreId);
          const bucket = songsByGenreId.get(key);
          if (bucket) {
            bucket.push(song);
          } else {
            songsByGenreId.set(key, [song]);
          }
        }
      }

      // Return results in the same order as the requested genre IDs
      return genreIds.map((genreId) => songsByGenreId.get(genreId) ?? []);
    },
  );
}
