import { Injectable, Scope } from "@nestjs/common";
import DataLoader from "dataloader";
import { ArtistType } from "../models/artist.type";
import { AlbumType } from "../models/album.type";
import { GenreType } from "../models/genre.type";
import { SongType, SongRawGqlType } from "../models/song.type";
import { ArtistsService } from "../../artists/artists.service";
import { AlbumsService } from "../../albums/albums.service";
import { GenresService } from "../../genres/genres.service";
import { SongsService } from "../../songs/songs.service";

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
    private readonly albumsService: AlbumsService,
    private readonly genresService: GenresService,
    private readonly songsService: SongsService,
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
   * DataLoader for batching album lookups by ID.
   * Caches results per-request to avoid duplicate fetches.
   * Uses database-level batch query via findByIds for optimal performance.
   */
  readonly albumLoader = new DataLoader<string, AlbumType | null>(
    async (ids: readonly string[]) => {
      // Single database query with IN clause
      const albums = await this.albumsService.findByIds(Array.from(ids));

      // Convert DTOs to GraphQL types
      return albums.map((album) => {
        if (!album) return null;
        return {
          id: String(album.id),
          title: album.title,
          releaseYear: album.releaseYear,
        } as AlbumType;
      });
    },
  );

  /**
   * DataLoader for batching songs by album ID.
   * Fetches all songs for given albums using database-level batching.
   */
  readonly songsByAlbumLoader = new DataLoader<string, SongType[]>(
    async (albumIds: readonly string[]) => {
      // Single database query with $in operator
      const songs = await this.songsService.findByAlbumIds(
        Array.from(albumIds),
      );

      // Build a lookup map from album ID to songs
      const songsByAlbumId = new Map<string, SongType[]>();

      for (const song of songs) {
        if (!song.album || typeof song.album !== "string") {
          continue;
        }
        const key = String(song.album);
        const bucket = songsByAlbumId.get(key);
        if (bucket) {
          bucket.push(song as unknown as SongType);
        } else {
          songsByAlbumId.set(key, [song as unknown as SongType]);
        }
      }

      // Return results in the same order as the requested album IDs
      return albumIds.map((albumId) => {
        const key = String(albumId);
        return songsByAlbumId.get(key) || [];
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
