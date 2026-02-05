import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Genre } from "../models/genre.entity";
import { GenresRepository } from "./genres.repository";

@Injectable()
export class SqlGenresRepository implements GenresRepository {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
  ) {}

  findAll(): Promise<Genre[]> {
    return this.genreRepository.find({ relations: ["songs"] });
  }

  async findOne(id: string): Promise<Genre | null> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return null;
    }

    return this.genreRepository.findOne({
      where: { id: numericId },
      relations: ["songs"],
    });
  }
}
