import { Injectable, Scope } from "@nestjs/common";
import DataLoader from "dataloader";
import { ArtistType } from "../models/artist.type";
import { GenreType } from "../models/genre.type";
import { SongType } from "../models/song.type";
import { ArtistsService } from "../../artists/artists.service";
import { GenresService } from "../../genres/genres.service";
import { SongsService } from "../../songs/songs.service";

/**
 * Request-scoped service providing DataLoader instances for batch loading entities.
 * Prevents N+1 query problems by batching and caching entity lookups within a single request.
 */
@Injectable({ scope: Scope.REQUEST })
export class DataLoadersService {
  constructor(
    private readonly artistsService: ArtistsService,
    private readonly genresService: GenresService,
    private readonly songsService: SongsService,
  ) {}

  /**
   * DataLoader for batching artist lookups by ID.
   * Caches results per-request to avoid duplicate fetches.
   */
  readonly artistLoader = new DataLoader<number, ArtistType | null>(
    async (ids: readonly number[]) => {
      // Fetch all artists in one batch
      const artists = await Promise.all(
        ids.map(async (id) => {
          const artist = await this.artistsService.findOne(String(id));
          if (!artist) return null;
          // Convert DTO to GraphQL type (DataLoader will handle songs separately)
          return {
            id: Number(artist.id),
            name: artist.name,
          } as ArtistType;
        }),
      );
      return artists;
    },
  );

  /**
   * DataLoader for batching genre lookups by ID.
   * Caches results per-request to avoid duplicate fetches.
   */
  readonly genreLoader = new DataLoader<number, GenreType | null>(
    async (ids: readonly number[]) => {
      // Fetch all genres in one batch
      const genres = await Promise.all(
        ids.map(async (id) => {
          const genre = await this.genresService.findOne(String(id));
          if (!genre) return null;
          // Convert DTO to GraphQL type (DataLoader will handle songs separately)
          return {
            id: Number(genre.id),
            name: genre.name,
          } as GenreType;
        }),
      );
      return genres;
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
   * Fetches all songs for a given artist.
   */
  readonly songsByArtistLoader = new DataLoader<number, SongType[]>(
    async (artistIds: readonly number[]) => {
      // Fetch all songs
      const allSongs = await this.songsService.findAll();

      // Group songs by artist ID
      return artistIds.map((artistId) => {
        return allSongs.filter((song) =>
          song.artists.includes(String(artistId)),
        ) as unknown as SongType[];
      });
    },
  );

  /**
   * DataLoader for batching songs by genre ID.
   * Fetches all songs for a given genre.
   */
  readonly songsByGenreLoader = new DataLoader<number, SongType[]>(
    async (genreIds: readonly number[]) => {
      // Fetch all songs
      const allSongs = await this.songsService.findAll();

      // Group songs by genre ID
      return genreIds.map((genreId) => {
        return allSongs.filter(
          (song) =>
            song.genres && song.genres.includes(String(genreId)),
        ) as unknown as SongType[];
      });
    },
  );
}
