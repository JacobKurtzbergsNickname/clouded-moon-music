import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Artist } from "../models/artist.entity";
import { ArtistsRepository } from "./artists.repository";

@Injectable()
export class SqlArtistsRepository implements ArtistsRepository {
  constructor(
    @InjectRepository(Artist)
    private readonly artistRepository: Repository<Artist>,
  ) {}

  findAll(): Promise<Artist[]> {
    return this.artistRepository.find({ relations: ["songs"] });
  }

  async findOne(id: string): Promise<Artist | null> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return null;
    }

    return this.artistRepository.findOne({
      where: { id: numericId },
      relations: ["songs"],
    });
  }
}
