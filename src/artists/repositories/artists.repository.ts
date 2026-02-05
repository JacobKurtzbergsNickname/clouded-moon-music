import { Artist } from "../models/artist.entity";

export interface ArtistsRepository {
  findAll(): Promise<Artist[]>;
  findOne(id: string): Promise<Artist | null>;
}

export const ARTISTS_REPOSITORY = Symbol("ARTISTS_REPOSITORY");
export const SQL_ARTISTS_REPOSITORY = Symbol("SQL_ARTISTS_REPOSITORY");
