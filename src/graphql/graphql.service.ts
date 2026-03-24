import { Injectable } from "@nestjs/common";
import { SongsService } from "../songs/songs.service";
import { ArtistsService } from "../artists/artists.service";
import { GenresService } from "../genres/genres.service";
import { PlaylistsService } from "../playlists/playlists.service";
import CreateSongDTO from "../songs/models/create-song.dto";
import { CreatePlaylistDTO } from "../playlists/models/create-playlist.dto";
import { SongRawGqlType } from "./models/song.type";
import { ArtistType } from "./models/artist.type";
import { GenreType } from "./models/genre.type";
import { PlaylistType } from "./models/playlist.type";

@Injectable()
export class GraphqlSongsService {
  constructor(private readonly songsService: SongsService) {}

  async findAll(): Promise<SongRawGqlType[]> {
    return this.songsService.findAll();
  }

  async findOne(id: string): Promise<SongRawGqlType | null> {
    return this.songsService.findOne(id);
  }

  async create(input: Partial<CreateSongDTO>): Promise<SongRawGqlType> {
    return this.songsService.create(input as CreateSongDTO);
  }

  async update(
    id: string,
    input: Partial<CreateSongDTO>,
  ): Promise<SongRawGqlType | null> {
    return this.songsService.update(id, input);
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
      id: String(a.id),
      name: a.name,
    })) as ArtistType[];
  }

  async findOne(id: string): Promise<ArtistType | null> {
    const artist = await this.artistsService.findOne(id);
    if (!artist) return null;
    return {
      id: String(artist.id),
      name: artist.name,
    } as ArtistType;
  }

  async create(name: string): Promise<ArtistType> {
    const artist = await this.artistsService.create(name);
    return { id: String(artist.id), name: artist.name } as ArtistType;
  }

  async update(id: string, name: string): Promise<ArtistType | null> {
    const artist = await this.artistsService.update(id, name);
    if (!artist) return null;
    return { id: String(artist.id), name: artist.name } as ArtistType;
  }

  remove(id: string): Promise<string | null> {
    return this.artistsService.remove(id);
  }
}

@Injectable()
export class GraphqlGenresService {
  constructor(private readonly genresService: GenresService) {}

  async findAll(): Promise<GenreType[]> {
    const genres = await this.genresService.findAll();
    return genres.map((g) => ({
      id: String(g.id),
      name: g.name,
    })) as GenreType[];
  }

  async findOne(id: string): Promise<GenreType | null> {
    const genre = await this.genresService.findOne(id);
    if (!genre) return null;
    return {
      id: String(genre.id),
      name: genre.name,
    } as GenreType;
  }

  async create(name: string): Promise<GenreType> {
    const genre = await this.genresService.create(name);
    return { id: String(genre.id), name: genre.name } as GenreType;
  }

  async update(id: string, name: string): Promise<GenreType | null> {
    const genre = await this.genresService.update(id, name);
    if (!genre) return null;
    return { id: String(genre.id), name: genre.name } as GenreType;
  }

  remove(id: string): Promise<string | null> {
    return this.genresService.remove(id);
  }
}

@Injectable()
export class GraphqlPlaylistsService {
  constructor(private readonly playlistsService: PlaylistsService) {}

  async findAll(): Promise<PlaylistType[]> {
    const playlists = await this.playlistsService.findAll();
    return playlists as unknown as PlaylistType[];
  }

  async findOne(id: string): Promise<PlaylistType | null> {
    const playlist = await this.playlistsService.findOne(id);
    return playlist as unknown as PlaylistType | null;
  }

  async create(input: CreatePlaylistDTO): Promise<PlaylistType> {
    const playlist = await this.playlistsService.create(input);
    return playlist as unknown as PlaylistType;
  }

  async update(
    id: string,
    input: Partial<CreatePlaylistDTO>,
  ): Promise<PlaylistType | null> {
    const playlist = await this.playlistsService.update(id, input);
    return playlist as unknown as PlaylistType | null;
  }

  remove(id: string): Promise<string | null> {
    return this.playlistsService.remove(id);
  }

  async addSong(
    playlistId: string,
    songId: string,
  ): Promise<PlaylistType | null> {
    const playlist = await this.playlistsService.addSong(playlistId, songId);
    return playlist as unknown as PlaylistType | null;
  }

  async removeSong(
    playlistId: string,
    songId: string,
  ): Promise<PlaylistType | null> {
    const playlist = await this.playlistsService.removeSong(playlistId, songId);
    return playlist as unknown as PlaylistType | null;
  }
}
