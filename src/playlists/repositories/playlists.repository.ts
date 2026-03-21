import { CreatePlaylistDTO } from "../models/create-playlist.dto";
import { PlaylistDTO } from "../models/playlist.dto";

export interface PlaylistsRepository {
  findAll(): Promise<PlaylistDTO[]>;
  findOne(id: string): Promise<PlaylistDTO | null>;
  findByIds(ids: string[]): Promise<(PlaylistDTO | null)[]>;
  create(dto: CreatePlaylistDTO): Promise<PlaylistDTO>;
  update(
    id: string,
    dto: Partial<CreatePlaylistDTO>,
  ): Promise<PlaylistDTO | null>;
  remove(id: string): Promise<string | null>;
  addSong(id: string, songId: string): Promise<PlaylistDTO | null>;
  removeSong(id: string, songId: string): Promise<PlaylistDTO | null>;
}

export const PLAYLISTS_REPOSITORY = Symbol("PLAYLISTS_REPOSITORY");
