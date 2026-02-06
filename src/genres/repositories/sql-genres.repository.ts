import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Genre } from "../models/genre.entity";
import { GenreDTO } from "../models/genre.dto";
import { GenresRepository } from "./genres.repository";

@Injectable()
export class SqlGenresRepository implements GenresRepository {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
  ) {}

  async findAll(): Promise<GenreDTO[]> {
    const genres = await this.genreRepository.find({ relations: ["songs"] });
    return genres.map((genre) => this.mapToDTO(genre));
  }

  /**
   * Find a genre by ID.
   * @param id - The genre ID as a string. Must be a valid numeric string.
   * @returns GenreDTO if found, null if not found or if ID format is invalid (non-numeric).
   *          Invalid ID formats are treated as "not found" rather than throwing an error.
   */
  async findOne(id: string): Promise<GenreDTO | null> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return null;
    }

    const genre = await this.genreRepository.findOne({
      where: { id: numericId },
      relations: ["songs"],
    });

    return genre ? this.mapToDTO(genre) : null;
  }

  private mapToDTO(genre: Genre): GenreDTO {
    return {
      id: genre.id.toString(),
      name: genre.name,
      songs: genre.songs ? genre.songs.map((song) => song.title) : [],
    };
  }
}
