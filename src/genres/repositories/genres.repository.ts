import { GenreDTO } from "../models/genre.dto";

export interface GenresRepository {
  findAll(): Promise<GenreDTO[]>;
  findOne(id: string): Promise<GenreDTO | null>;
  findByIds(ids: string[]): Promise<(GenreDTO | null)[]>;
}

export const GENRES_REPOSITORY = Symbol("GENRES_REPOSITORY");
export const SQL_GENRES_REPOSITORY = Symbol("SQL_GENRES_REPOSITORY");
