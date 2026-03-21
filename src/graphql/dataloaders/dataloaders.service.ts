import { Injectable, Scope } from "@nestjs/common";
import DataLoader from "dataloader";
import { ArtistType } from "../models/artist.type";
import { GenreType } from "../models/genre.type";
import { SongType } from "../models/song.type";
import { PlaylistType } from "../models/playlist.type";
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
   */
  readonly songLoader = new DataLoader<string, SongType | null>(
    async (ids: readonly string[]) => {
      // Fetch all songs in one batch
      const songs = await Promise.all(
        ids.map(async (id) => {
          const song = await this.songsService.findOne(id);
          if (!song) return null;
          // Return as SongType (relationships resolved separately)
          return song as unknown as SongType;
        }),
      );
      return songs;
    },
  );

  /**
   * DataLoader for batching songs by artist ID.
   * Fetches all songs for given artists using database-level batching.
   */
  readonly songsByArtistLoader = new DataLoader<string, SongType[]>(
    async (artistIds: readonly string[]) => {
      // Single database query with $in operator
      const songs = await this.songsService.findByArtistIds(
        Array.from(artistIds),
      );

      // Build a lookup map from artist ID to songs
      const songsByArtistId = new Map<string, SongType[]>();

      for (const song of songs) {
        if (!song.artists || !Array.isArray(song.artists)) {
          continue;
        }
        for (const artistId of song.artists) {
          const key = String(artistId);
          const bucket = songsByArtistId.get(key);
          if (bucket) {
            bucket.push(song as unknown as SongType);
          } else {
            songsByArtistId.set(key, [song as unknown as SongType]);
          }
        }
      }

      // Return results in the same order as the requested artist IDs
      return artistIds.map((artistId) => {
        const key = String(artistId);
        return songsByArtistId.get(key) || [];
      });
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
  readonly songsByGenreLoader = new DataLoader<string, SongType[]>(
    async (genreIds: readonly string[]) => {
      // Single database query with $in operator
      const songs = await this.songsService.findByGenreIds(
        Array.from(genreIds),
      );

      // Build a lookup map from genre ID to songs
      const songsByGenreId = new Map<string, SongType[]>();

      for (const song of songs) {
        if (!song.genres || !Array.isArray(song.genres)) {
          continue;
        }
        for (const genreId of song.genres) {
          const key = String(genreId);
          const bucket = songsByGenreId.get(key);
          if (bucket) {
            bucket.push(song as unknown as SongType);
          } else {
            songsByGenreId.set(key, [song as unknown as SongType]);
          }
        }
      }

      // Return results in the same order as the requested genre IDs
      return genreIds.map((genreId) => {
        const key = String(genreId);
        return songsByGenreId.get(key) || [];
      });
    },
  );
}
