import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
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

  /**
   * Find an artist by ID.
   * @param id - The artist ID as a string. Must be a valid numeric string.
   * @returns ArtistDTO if found, null if not found or if ID format is invalid (non-numeric).
   *          Invalid ID formats are treated as "not found" rather than throwing an error.
   */
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

  /**
   * Find multiple artists by IDs in a single database query using IN clause.
   * @param ids - Array of artist IDs as strings
   * @returns Array of ArtistDTO or null in the same order as input IDs
   */
  async findByIds(ids: string[]): Promise<(ArtistDTO | null)[]> {
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
    const artists = await this.artistRepository.find({
      where: { id: In(numericIds) },
      relations: ["songs"],
    });

    // Create a map for O(1) lookup
    const artistMap = new Map<number, Artist>();
    artists.forEach((artist) => artistMap.set(artist.id, artist));

    // Return results in the same order as input IDs
    return ids.map((id) => {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        return null;
      }
      const artist = artistMap.get(numericId);
      return artist ? this.mapToDTO(artist) : null;
    });
  }

  async create(name: string): Promise<ArtistDTO> {
    const artist = this.artistRepository.create({ name });
    const saved = await this.artistRepository.save(artist);
    return this.mapToDTO(saved);
  }

  async update(id: string, name: string): Promise<ArtistDTO | null> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return null;
    }
    const artist = await this.artistRepository.findOne({
      where: { id: numericId },
      relations: ["songs"],
    });
    if (!artist) {
      return null;
    }
    artist.name = name;
    const saved = await this.artistRepository.save(artist);
    return this.mapToDTO(saved);
  }

  async remove(id: string): Promise<string | null> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return null;
    }
    const result = await this.artistRepository.delete(numericId);
    return result.affected ? id : null;
  }

  private mapToDTO(artist: Artist): ArtistDTO {
    return {
      id: artist.id.toString(),
      name: artist.name,
      songs: artist.songs ? artist.songs.map((song) => song.title) : [],
    };
  }
}
