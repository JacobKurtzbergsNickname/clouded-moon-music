import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
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

  /**
   * Find multiple genres by IDs in a single database query using IN clause.
   * @param ids - Array of genre IDs as strings
   * @returns Array of GenreDTO or null in the same order as input IDs
   */
  async findByIds(ids: string[]): Promise<(GenreDTO | null)[]> {
    if (ids.length === 0) {
      return [];
    }

    // Parse and filter valid numeric IDs
    const numericIds = ids
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));

    if (numericIds.length === 0) {
      return ids.map(() => null);
    }

    // Single database query with IN clause
    const genres = await this.genreRepository.find({
      where: { id: In(numericIds) },
      relations: ["songs"],
    });

    // Create a map for O(1) lookup
    const genreMap = new Map<number, Genre>();
    genres.forEach((genre) => genreMap.set(genre.id, genre));

    // Return results in the same order as input IDs
    return ids.map((id) => {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        return null;
      }
      const genre = genreMap.get(numericId);
      return genre ? this.mapToDTO(genre) : null;
    });
  }

  async create(name: string): Promise<GenreDTO> {
    const genre = this.genreRepository.create({ name });
    const saved = await this.genreRepository.save(genre);
    return this.mapToDTO(saved);
  }

  async update(id: string, name: string): Promise<GenreDTO | null> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return null;
    }
    const genre = await this.genreRepository.findOne({
      where: { id: numericId },
      relations: ["songs"],
    });
    if (!genre) {
      return null;
    }
    genre.name = name;
    const saved = await this.genreRepository.save(genre);
    return this.mapToDTO(saved);
  }

  async remove(id: string): Promise<string | null> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return null;
    }
    const result = await this.genreRepository.delete(numericId);
    return result.affected ? id : null;
  }

  private mapToDTO(genre: Genre): GenreDTO {
    return {
      id: genre.id.toString(),
      name: genre.name,
      songs: genre.songs ? genre.songs.map((song) => song.title) : [],
    };
  }
}
