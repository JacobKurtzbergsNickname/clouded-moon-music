import CreateSongDTO from "../models/create-song.dto";
import { Song } from "../models/song.entity";

export interface SongsRepository {
  findAll(): Promise<Song[]>;
  findOne(id: string): Promise<Song | null>;
  create(dto: CreateSongDTO): Promise<Song>;
  update(id: string, song: Partial<CreateSongDTO>): Promise<Song | null>;
  replace(id: string, song: CreateSongDTO): Promise<Song | null>;
  remove(id: string): Promise<string | null>;
}

export const SONGS_REPOSITORY = Symbol("SONGS_REPOSITORY");
export const MONGO_SONGS_REPOSITORY = Symbol("MONGO_SONGS_REPOSITORY");
export const SQL_SONGS_REPOSITORY = Symbol("SQL_SONGS_REPOSITORY");
