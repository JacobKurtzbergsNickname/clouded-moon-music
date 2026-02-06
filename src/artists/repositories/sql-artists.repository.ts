import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Artist } from "../models/artist.entity";
import { ArtistDTO } from "../models/artist.dto";
import { ArtistsRepository } from "./artists.repository";

@Injectable()
export class SqlArtistsRepository implements ArtistsRepository {
  constructor(
    @InjectRepository(Artist)
    private readonly artistRepository: Repository<Artist>,
  ) {}

  async findAll(): Promise<ArtistDTO[]> {
    const artists = await this.artistRepository.find({ relations: ["songs"] });
    return artists.map((artist) => this.mapToDTO(artist));
  }

  async findOne(id: string): Promise<ArtistDTO | null> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return null;
    }

    const artist = await this.artistRepository.findOne({
      where: { id: numericId },
      relations: ["songs"],
    });

    return artist ? this.mapToDTO(artist) : null;
  }

  private mapToDTO(artist: Artist): ArtistDTO {
    return {
      id: artist.id.toString(),
      name: artist.name,
      songs: artist.songs ? artist.songs.map((song) => song.title) : [],
    };
  }
}
