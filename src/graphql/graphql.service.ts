import { Injectable } from "@nestjs/common";
import { SongsService } from "../songs/songs.service";
import { ArtistsService } from "../artists/artists.service";
import { GenresService } from "../genres/genres.service";
import CreateSongDTO from "../songs/models/create-song.dto";
import { SongType } from "./models/song.type";
import { ArtistType } from "./models/artist.type";
import { GenreType } from "./models/genre.type";

@Injectable()
export class GraphqlSongsService {
  constructor(private readonly songsService: SongsService) {}

  async findAll(): Promise<SongType[]> {
    const songs = await this.songsService.findAll();
    return songs as unknown as SongType[];
  }

  async findOne(id: string): Promise<SongType | null> {
    const song = await this.songsService.findOne(id);
    return song as unknown as SongType | null;
  }

  async create(input: Partial<CreateSongDTO>): Promise<SongType> {
    const song = await this.songsService.create(input as CreateSongDTO);
    return song as unknown as SongType;
  }

  async update(id: string, input: Partial<CreateSongDTO>): Promise<SongType | null> {
    const song = await this.songsService.update(id, input);
    return song as unknown as SongType | null;
  }

  remove(id: string): Promise<string | null> {
    return this.songsService.remove(id);
  }
}

@Injectable()
export class GraphqlArtistsService {
  constructor(private readonly artistsService: ArtistsService) {}

  async findAll(): Promise<ArtistType[]> {
    const artists = await this.artistsService.findAll();
    return artists.map((a) => ({
      id: Number(a.id),
      name: a.name,
    })) as ArtistType[];
  }

  async findOne(id: string): Promise<ArtistType | null> {
    const artist = await this.artistsService.findOne(id);
    if (!artist) return null;
    return {
      id: Number(artist.id),
      name: artist.name,
    } as ArtistType;
  }
}

@Injectable()
export class GraphqlGenresService {
  constructor(private readonly genresService: GenresService) {}

  async findAll(): Promise<GenreType[]> {
    const genres = await this.genresService.findAll();
    return genres.map((g) => ({
      id: Number(g.id),
      name: g.name,
    })) as GenreType[];
  }

  async findOne(id: string): Promise<GenreType | null> {
    const genre = await this.genresService.findOne(id);
    if (!genre) return null;
    return {
      id: Number(genre.id),
      name: genre.name,
    } as GenreType;
  }
}
