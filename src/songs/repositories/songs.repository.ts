import CreateSongDTO from "../models/create-song.dto";
import { SongDTO } from "../models/song.dto";

export interface SongsRepository {
  findAll(): Promise<SongDTO[]>;
  findOne(id: number): Promise<SongDTO | null>;
  create(dto: CreateSongDTO): Promise<SongDTO>;
  update(id: number, song: Partial<CreateSongDTO>): Promise<SongDTO | null>;
  replace(id: number, song: CreateSongDTO): Promise<SongDTO | null>;
  remove(id: number): Promise<number | null>;
}

export const SONGS_REPOSITORY = Symbol("SONGS_REPOSITORY");
export const MONGO_SONGS_REPOSITORY = Symbol("MONGO_SONGS_REPOSITORY");
export const SQL_SONGS_REPOSITORY = Symbol("SQL_SONGS_REPOSITORY");
