import { ArtistDTO } from "../models/artist.dto";

export interface ArtistsRepository {
  findAll(): Promise<ArtistDTO[]>;
  findOne(id: string): Promise<ArtistDTO | null>;
  findByIds(ids: string[]): Promise<(ArtistDTO | null)[]>;
  create(name: string): Promise<ArtistDTO>;
  update(id: string, name: string): Promise<ArtistDTO | null>;
  remove(id: string): Promise<string | null>;
}

export const ARTISTS_REPOSITORY = Symbol("ARTISTS_REPOSITORY");
export const SQL_ARTISTS_REPOSITORY = Symbol("SQL_ARTISTS_REPOSITORY");
