import CreateSongDTO from "../models/create-song.dto";
import { Song } from "../models/song.entity";

// API representation of Song with string ID
export type SongResponse = Omit<Song, "id"> & { id: string };

export interface SongsRepository {
  findAll(): Promise<SongResponse[]>;
  findOne(id: string): Promise<SongResponse | null>;
  create(dto: CreateSongDTO): Promise<SongResponse>;
  update(
    id: string,
    song: Partial<CreateSongDTO>,
  ): Promise<SongResponse | null>;
  replace(id: string, song: CreateSongDTO): Promise<SongResponse | null>;
  remove(id: string): Promise<string | null>;
}

export const SONGS_REPOSITORY = Symbol("SONGS_REPOSITORY");
export const MONGO_SONGS_REPOSITORY = Symbol("MONGO_SONGS_REPOSITORY");
export const SQL_SONGS_REPOSITORY = Symbol("SQL_SONGS_REPOSITORY");
