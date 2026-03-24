import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Album } from "../models/album.entity";
import { AlbumDTO } from "../models/album.dto";
import { AlbumsRepository } from "./albums.repository";

@Injectable()
export class SqlAlbumsRepository implements AlbumsRepository {
  constructor(
    @InjectRepository(Album)
    private readonly albumRepository: Repository<Album>,
  ) {}

  async findAll(): Promise<AlbumDTO[]> {
    const albums = await this.albumRepository.find();
    return albums.map((album) => this.mapToDTO(album));
  }

  /**
   * Find an album by ID.
   * @param id - The album ID as a string. Must be a valid numeric string.
   * @returns AlbumDTO if found, null if not found or if ID format is invalid (non-numeric).
   */
  async findOne(id: string): Promise<AlbumDTO | null> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return null;
    }

    const album = await this.albumRepository.findOne({
      where: { id: numericId },
    });

    return album ? this.mapToDTO(album) : null;
  }

  /**
   * Find multiple albums by IDs in a single database query using IN clause.
   * @param ids - Array of album IDs as strings
   * @returns Array of AlbumDTO or null in the same order as input IDs
   */
  async findByIds(ids: string[]): Promise<(AlbumDTO | null)[]> {
    if (ids.length === 0) {
      return [];
    }

    const numericIds = ids
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));

    if (numericIds.length === 0) {
      return ids.map(() => null);
    }

    const albums = await this.albumRepository.find({
      where: { id: In(numericIds) },
    });

    const albumMap = new Map<number, Album>();
    albums.forEach((album) => albumMap.set(album.id, album));

    return ids.map((id) => {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        return null;
      }
      const album = albumMap.get(numericId);
      return album ? this.mapToDTO(album) : null;
    });
  }

  private mapToDTO(album: Album): AlbumDTO {
    return {
      id: album.id.toString(),
      title: album.title,
      releaseYear: album.releaseYear ?? undefined,
      songs: [],
    };
  }
}
