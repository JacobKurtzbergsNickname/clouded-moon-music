import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Song } from "../models/song.entity";
import { Artist } from "../models/artist.entity";
import { Genre } from "../models/genre.entity";
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

  async findAll(): Promise<Song[]> {
    const songs = await this.songRepository.find({
      relations: ["artists", "genres"],
    });
    return songs.map((song) => this.toSongWithStringId(song));
  }

  async findOne(id: string): Promise<Song | null> {
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

  async create(dto: CreateSongDTO): Promise<Song> {
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

  async update(id: string, dto: Partial<CreateSongDTO>): Promise<Song | null> {
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

  async replace(id: string, dto: CreateSongDTO): Promise<Song | null> {
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
   * Converts a Song entity with numeric ID to one with string ID
   */
  private toSongWithStringId(song: Song): Song {
    return {
      ...song,
      id: song.id.toString(),
    };
  }
}
