import { Genre } from "../models/genre.entity";

export interface GenresRepository {
  findAll(): Promise<Genre[]>;
  findOne(id: string): Promise<Genre | null>;
}

export const GENRES_REPOSITORY = Symbol("GENRES_REPOSITORY");
export const SQL_GENRES_REPOSITORY = Symbol("SQL_GENRES_REPOSITORY");
