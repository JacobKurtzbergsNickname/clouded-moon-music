import { AlbumDTO } from "../models/album.dto";

export interface AlbumsRepository {
  findAll(): Promise<AlbumDTO[]>;
  findOne(id: string): Promise<AlbumDTO | null>;
  findByIds(ids: string[]): Promise<(AlbumDTO | null)[]>;
}

export const ALBUMS_REPOSITORY = Symbol("ALBUMS_REPOSITORY");
export const SQL_ALBUMS_REPOSITORY = Symbol("SQL_ALBUMS_REPOSITORY");
