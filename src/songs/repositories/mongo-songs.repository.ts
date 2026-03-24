import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Song, SongDocument } from "../models/song.schema";
import CreateSongDTO from "../models/create-song.dto";
import { SongDTO } from "../models/song.dto";
import { SongsRepository } from "./songs.repository";

@Injectable()
export class MongoSongsRepository implements SongsRepository {
  constructor(
    @InjectModel(Song.name) private readonly songModel: Model<SongDocument>,
  ) {}

  async findAll(): Promise<SongDTO[]> {
    const docs = await this.songModel.find().exec();
    return docs.map((doc) => this.toSong(doc));
  }

  async findOne(id: string): Promise<SongDTO | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await this.songModel.findById(id).exec();
    return doc ? this.toSong(doc) : null;
  }

  async create(dto: CreateSongDTO): Promise<SongDTO> {
    const createdSong = new this.songModel(dto);
    const doc = await createdSong.save();
    return this.toSong(doc);
  }

  async update(
    id: string,
    song: Partial<CreateSongDTO>,
  ): Promise<SongDTO | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await this.songModel
      .findByIdAndUpdate(id, song, { new: true })
      .exec();
    return doc ? this.toSong(doc) : null;
  }

  async replace(id: string, song: CreateSongDTO): Promise<SongDTO | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await this.songModel
      .findByIdAndUpdate(id, song, {
        new: true,
        overwrite: true,
        runValidators: true,
      })
      .exec();
    return doc ? this.toSong(doc) : null;
  }

  async remove(id: string): Promise<string | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const result = await this.songModel.findByIdAndDelete(id).exec();
    return result ? id : null;
  }

  /**
   * Find all songs that have any of the specified artist IDs in a single database query.
   * @param artistIds - Array of artist IDs to filter by
   * @returns Array of SongDTO objects containing any of the specified artists
   */
  async findByArtistIds(artistIds: string[]): Promise<SongDTO[]> {
    if (artistIds.length === 0) {
      return [];
    }
    // Single MongoDB query using $in operator
    const docs = await this.songModel
      .find({ artists: { $in: artistIds } })
      .exec();
    return docs.map((doc) => this.toSong(doc));
  }

  /**
   * Find all songs that have any of the specified genre IDs in a single database query.
   * @param genreIds - Array of genre IDs to filter by
   * @returns Array of SongDTO objects containing any of the specified genres
   */
  async findByGenreIds(genreIds: string[]): Promise<SongDTO[]> {
    if (genreIds.length === 0) {
      return [];
    }
    // Single MongoDB query using $in operator
    const docs = await this.songModel
      .find({ genres: { $in: genreIds } })
      .exec();
    return docs.map((doc) => this.toSong(doc));
  }

  /**
   * Find all songs that belong to any of the specified album IDs in a single database query.
   * @param albumIds - Array of album IDs to filter by
   * @returns Array of SongDTO objects belonging to any of the specified albums
   */
  async findByAlbumIds(albumIds: string[]): Promise<SongDTO[]> {
    if (albumIds.length === 0) {
      return [];
    }
    // Single MongoDB query using $in operator
    const docs = await this.songModel.find({ album: { $in: albumIds } }).exec();
    return docs.map((doc) => this.toSong(doc));
  }

  /**
   * Converts a Mongoose document to a plain Song DTO object
   */
  private toSong(doc: SongDocument): SongDTO {
    return {
      id: doc._id.toString(),
      title: doc.title,
      artists: doc.artists,
      album: doc.album,
      year: doc.year,
      genres: doc.genres,
      duration: doc.duration,
      releaseDate: doc.releaseDate,
    };
  }
}
