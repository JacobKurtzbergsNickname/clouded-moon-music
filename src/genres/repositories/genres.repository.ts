import { GenreDTO } from "../models/genre.dto";

export interface GenresRepository {
  findAll(): Promise<GenreDTO[]>;
  findOne(id: string): Promise<GenreDTO | null>;
  findByIds(ids: string[]): Promise<(GenreDTO | null)[]>;
  create(name: string): Promise<GenreDTO>;
  update(id: string, name: string): Promise<GenreDTO | null>;
  remove(id: string): Promise<string | null>;
}

export const GENRES_REPOSITORY = Symbol("GENRES_REPOSITORY");
export const SQL_GENRES_REPOSITORY = Symbol("SQL_GENRES_REPOSITORY");
