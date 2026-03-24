import CreateSongDTO from "../models/create-song.dto";
import { SongDTO } from "../models/song.dto";

export interface SongsRepository {
  findAll(): Promise<SongDTO[]>;
  findOne(id: string): Promise<SongDTO | null>;
  findByIds(ids: string[]): Promise<(SongDTO | null)[]>;
  create(dto: CreateSongDTO): Promise<SongDTO>;
  update(id: string, song: Partial<CreateSongDTO>): Promise<SongDTO | null>;
  replace(id: string, song: CreateSongDTO): Promise<SongDTO | null>;
  remove(id: string): Promise<string | null>;
  findByArtistIds(artistIds: string[]): Promise<SongDTO[]>;
  findByGenreIds(genreIds: string[]): Promise<SongDTO[]>;
  findByAlbumIds(albumIds: string[]): Promise<SongDTO[]>;
}

export const SONGS_REPOSITORY = Symbol("SONGS_REPOSITORY");
export const MONGO_SONGS_REPOSITORY = Symbol("MONGO_SONGS_REPOSITORY");
export const SQL_SONGS_REPOSITORY = Symbol("SQL_SONGS_REPOSITORY");
