import { CreateSongDTO } from "../models/create-song.dto";
import { Song } from "../models/song.entity";
import { ISong } from "../models/song.interface";

export interface SongsRepository {
  findAll(): Array<Song>;
  findOne(id: number): Song | string;
  create(dto: CreateSongDTO): ISong;
  update(id: number, song: Omit<Song, "id">): Song;
  replace(id: number, song: Song): Song;
  remove(id: number): number | null;
}

export const SONGS_REPOSITORY = Symbol("SONGS_REPOSITORY");
export const MONGO_SONGS_REPOSITORY = Symbol("MONGO_SONGS_REPOSITORY");
export const SQL_SONGS_REPOSITORY = Symbol("SQL_SONGS_REPOSITORY");
