import CreateSongDTO from "../models/create-song.dto";
import { Song } from "../models/song.entity";

export interface SongsRepository {
  findAll(): Promise<Song[]>;
  findOne(id: number): Promise<Song | null>;
  create(dto: CreateSongDTO): Promise<Song>;
  update(id: number, song: Partial<CreateSongDTO>): Promise<Song | null>;
  replace(id: number, song: CreateSongDTO): Promise<Song | null>;
  remove(id: number): Promise<number | null>;
}

export const SONGS_REPOSITORY = Symbol("SONGS_REPOSITORY");
export const MONGO_SONGS_REPOSITORY = Symbol("MONGO_SONGS_REPOSITORY");
export const SQL_SONGS_REPOSITORY = Symbol("SQL_SONGS_REPOSITORY");
