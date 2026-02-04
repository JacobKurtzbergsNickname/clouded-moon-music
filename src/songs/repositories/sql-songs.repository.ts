import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Song } from "../models/song.entity";
import { SongDTO } from "../models/song.dto";
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

  async findAll(): Promise<SongDTO[]> {
    const songs = await this.songRepository.find({
      relations: ["artists", "genres"],
    });
    return songs.map((song) => song.toDTO());
  }

  async findOne(id: number): Promise<SongDTO | null> {
    const song = await this.songRepository.findOne({
      where: { id },
      relations: ["artists", "genres"],
    });
    return song ? song.toDTO() : null;
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
    return savedSong.toDTO();
  }

  async update(id: number, dto: Partial<CreateSongDTO>): Promise<SongDTO | null> {
    const song = await this.songRepository.findOne({
      where: { id },
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
    return savedSong.toDTO();
  }

  async replace(id: number, dto: CreateSongDTO): Promise<SongDTO | null> {
    const song = await this.songRepository.findOne({
      where: { id },
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
    return savedSong.toDTO();
  }

  async remove(id: number): Promise<number | null> {
    const song = await this.songRepository.findOne({ where: { id } });

    if (!song) {
      return null;
    }

    await this.songRepository.remove(song);
    return id;
  }
}
