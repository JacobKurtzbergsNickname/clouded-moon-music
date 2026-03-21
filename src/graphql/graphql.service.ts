import { Injectable } from "@nestjs/common";
import { SongsService } from "../songs/songs.service";
import { ArtistsService } from "../artists/artists.service";
import { GenresService } from "../genres/genres.service";
import { PlaylistsService } from "../playlists/playlists.service";
import CreateSongDTO from "../songs/models/create-song.dto";
import { CreatePlaylistDTO } from "../playlists/models/create-playlist.dto";
import { SongType } from "./models/song.type";
import { ArtistType } from "./models/artist.type";
import { GenreType } from "./models/genre.type";
import { PlaylistType } from "./models/playlist.type";

@Injectable()
export class GraphqlSongsService {
  constructor(private readonly songsService: SongsService) {}

  async findAll(): Promise<SongType[]> {
    const songs = await this.songsService.findAll();
    // Safe cast: SongDTO structure matches SongType for scalar fields.
    // Relationship fields (artists, genres) are resolved via @ResolveField in resolver.
    return songs as unknown as SongType[];
  }

  async findOne(id: string): Promise<SongType | null> {
    const song = await this.songsService.findOne(id);
    // Safe cast: SongDTO structure matches SongType for scalar fields.
    // Relationship fields (artists, genres) are resolved via @ResolveField in resolver.
    return song as unknown as SongType | null;
  }

  async create(input: Partial<CreateSongDTO>): Promise<SongType> {
    const song = await this.songsService.create(input as CreateSongDTO);
    // Safe cast: SongDTO structure matches SongType for scalar fields.
    // Relationship fields (artists, genres) are resolved via @ResolveField in resolver.
    return song as unknown as SongType;
  }

  async update(
    id: string,
    input: Partial<CreateSongDTO>,
  ): Promise<SongType | null> {
    const song = await this.songsService.update(id, input);
    // Safe cast: SongDTO structure matches SongType for scalar fields.
    // Relationship fields (artists, genres) are resolved via @ResolveField in resolver.
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
