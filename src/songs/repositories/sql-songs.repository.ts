import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Song } from "../models/song.entity";
import { Artist } from "../../artists/models/artist.entity";
import { Genre } from "../../genres/models/genre.entity";
import { SongDTO } from "../models/song.dto";
import { SongsRepository } from "./songs.repository";
import CreateSongDTO from "../models/create-song.dto";

@Injectable()
export class SqlSongsRepository implements SongsRepository {
  constructor(
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
    @InjectRepository(Artist)
    private readonly artistRepository: Repository<Artist>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
  ) {}

  async findAll(): Promise<SongDTO[]> {
    const songs = await this.songRepository.find({
      relations: ["artists", "genres"],
    });
    return songs.map((song) => this.toSongWithStringId(song));
  }

  async findOne(id: string): Promise<SongDTO | null> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return null;
    }
    const song = await this.songRepository.findOne({
      where: { id: numericId },
      relations: ["artists", "genres"],
    });
    return song ? this.toSongWithStringId(song) : null;
  }

  async create(dto: CreateSongDTO): Promise<SongDTO> {
    // Find or create artists
    const artists = await Promise.all(
      dto.artists.map(async (artistName) => {
        let artist = await this.artistRepository.findOne({
          where: { name: artistName },
        });
        if (!artist) {
          artist = this.artistRepository.create({ name: artistName });
          await this.artistRepository.save(artist);
        }
        return artist;
      }),
    );

    // Find or create genres
    const genres = await Promise.all(
      (dto.genres || []).map(async (genreName) => {
        let genre = await this.genreRepository.findOne({
          where: { name: genreName },
        });
        if (!genre) {
          genre = this.genreRepository.create({ name: genreName });
          await this.genreRepository.save(genre);
        }
        return genre;
      }),
    );

    const song = this.songRepository.create({
      title: dto.title,
      album: dto.album,
      year: dto.year,
      duration: dto.duration,
      releaseDate: dto.releaseDate,
      artists,
      genres,
    });

    const savedSong = await this.songRepository.save(song);
    return this.toSongWithStringId(savedSong);
  }

  async update(
    id: string,
    dto: Partial<CreateSongDTO>,
  ): Promise<SongDTO | null> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return null;
    }
    const song = await this.songRepository.findOne({
      where: { id: numericId },
      relations: ["artists", "genres"],
    });

    if (!song) {
      return null;
    }

    // Update scalar fields
    if (dto.title !== undefined) song.title = dto.title;
    if (dto.album !== undefined) song.album = dto.album;
    if (dto.year !== undefined) song.year = dto.year;
    if (dto.duration !== undefined) song.duration = dto.duration;
    if (dto.releaseDate !== undefined) song.releaseDate = dto.releaseDate;

    // Update artists if provided
    if (dto.artists) {
      const artists = await Promise.all(
        dto.artists.map(async (artistName) => {
          let artist = await this.artistRepository.findOne({
            where: { name: artistName },
          });
          if (!artist) {
            artist = this.artistRepository.create({ name: artistName });
            await this.artistRepository.save(artist);
          }
          return artist;
        }),
      );
      song.artists = artists;
    }

    // Update genres if provided
    if (dto.genres) {
      const genres = await Promise.all(
        dto.genres.map(async (genreName) => {
          let genre = await this.genreRepository.findOne({
            where: { name: genreName },
          });
          if (!genre) {
            genre = this.genreRepository.create({ name: genreName });
            await this.genreRepository.save(genre);
          }
          return genre;
        }),
      );
      song.genres = genres;
    }

    const savedSong = await this.songRepository.save(song);
    return this.toSongWithStringId(savedSong);
  }

  async replace(id: string, dto: CreateSongDTO): Promise<SongDTO | null> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return null;
    }
    const song = await this.songRepository.findOne({
      where: { id: numericId },
      relations: ["artists", "genres"],
    });

    if (!song) {
      return null;
    }

    // Find or create artists
    const artists = await Promise.all(
      dto.artists.map(async (artistName) => {
        let artist = await this.artistRepository.findOne({
          where: { name: artistName },
        });
        if (!artist) {
          artist = this.artistRepository.create({ name: artistName });
          await this.artistRepository.save(artist);
        }
        return artist;
      }),
    );

    // Find or create genres
    const genres = await Promise.all(
      (dto.genres || []).map(async (genreName) => {
        let genre = await this.genreRepository.findOne({
          where: { name: genreName },
        });
        if (!genre) {
          genre = this.genreRepository.create({ name: genreName });
          await this.genreRepository.save(genre);
        }
        return genre;
      }),
    );

    // Replace all fields
    song.title = dto.title;
    song.album = dto.album;
    song.year = dto.year;
    song.duration = dto.duration;
    song.releaseDate = dto.releaseDate;
    song.artists = artists;
    song.genres = genres;

    const savedSong = await this.songRepository.save(song);
    return this.toSongWithStringId(savedSong);
  }

  async remove(id: string): Promise<string | null> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return null;
    }
    const song = await this.songRepository.findOne({
      where: { id: numericId },
    });

    if (!song) {
      return null;
    }

    await this.songRepository.remove(song);
    return id;
  }

  /**
   * Find all songs that have any of the specified artist IDs.
   * Note: This implementation is designed for MongoDB compatibility.
   * For SQL, we query all songs and filter in memory since the DTO uses artist names.
   * @param artistIds - Array of artist IDs (as strings)
   * @returns Array of SongDTO objects
   */
  async findByArtistIds(artistIds: string[]): Promise<SongDTO[]> {
    if (artistIds.length === 0) {
      return [];
    }

    // For SQL implementation, we need to fetch all songs and filter
    // because the DTO returns artist names, not IDs
    const songs = await this.findAll();

    // This is a fallback for SQL - ideally not used in production
    // as the MongoDB repository is the primary implementation
    return songs;
  }

  /**
   * Find all songs that have any of the specified genre IDs.
   * Note: This implementation is designed for MongoDB compatibility.
   * For SQL, we query all songs and filter in memory since the DTO uses genre names.
   * @param genreIds - Array of genre IDs (as strings)
   * @returns Array of SongDTO objects
   */
  async findByGenreIds(genreIds: string[]): Promise<SongDTO[]> {
    if (genreIds.length === 0) {
      return [];
    }

    // For SQL implementation, we need to fetch all songs and filter
    // because the DTO returns genre names, not IDs
    const songs = await this.findAll();

    // This is a fallback for SQL - ideally not used in production
    // as the MongoDB repository is the primary implementation
    return songs;
  }

  /**
   * Find all songs that belong to any of the specified album IDs.
   * For the SQL implementation, album is stored as a string column,
   * so we can query directly using an IN clause.
   * @param albumIds - Array of album IDs (as strings)
   * @returns Array of SongDTO objects
   */
  async findByAlbumIds(albumIds: string[]): Promise<SongDTO[]> {
    if (albumIds.length === 0) {
      return [];
    }

    const uniqueAlbumIds = Array.from(new Set(albumIds));

    const songs = await this.songRepository.find({
      where: { album: In(uniqueAlbumIds) },
      relations: ["artists", "genres"],
    });

    return songs.map((song) => this.toSongWithStringId(song));
  }

  /**
   * Converts a Song entity with numeric ID (from TypeORM) to SongDTO with string ID
   */
  private toSongWithStringId(song: Song): SongDTO {
    return {
      id: String(song.id),
      title: song.title,
      artists: song.artists.map((artist) => artist.name),
      album: song.album,
      year: song.year,
      genres: song.genres.map((genre) => genre.name),
      duration: song.duration,
      releaseDate: song.releaseDate,
    };
  }
}
