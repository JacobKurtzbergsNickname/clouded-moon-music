import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Song, SongDocument } from "../models/song.schema";
import { SongDTO } from "../models/song.dto";
import CreateSongDTO from "../models/create-song.dto";
import { SongsRepository } from "./songs.repository";

@Injectable()
export class MongoSongsRepository implements SongsRepository {
  constructor(
    @InjectModel(Song.name) private readonly songModel: Model<SongDocument>,
  ) {}

  async findAll(): Promise<SongDTO[]> {
    const docs = await this.songModel.find().exec();
    return docs.map((doc) => this.toSongDTO(doc));
  }

  async findOne(id: number): Promise<SongDTO | null> {
    const stringId = id.toString();
    if (!Types.ObjectId.isValid(stringId)) {
      return null;
    }
    const doc = await this.songModel.findById(stringId).exec();
    return doc ? this.toSongDTO(doc) : null;
  }

  async create(dto: CreateSongDTO): Promise<SongDTO> {
    const createdSong = new this.songModel(dto);
    const doc = await createdSong.save();
    return this.toSongDTO(doc);
  }

  async update(
    id: number,
    song: Partial<CreateSongDTO>,
  ): Promise<SongDTO | null> {
    const stringId = id.toString();
    if (!Types.ObjectId.isValid(stringId)) {
      return null;
    }
    const doc = await this.songModel
      .findByIdAndUpdate(stringId, song, { new: true })
      .exec();
    return doc ? this.toSongDTO(doc) : null;
  }

  async replace(id: number, song: CreateSongDTO): Promise<SongDTO | null> {
    const stringId = id.toString();
    if (!Types.ObjectId.isValid(stringId)) {
      return null;
    }
    const doc = await this.songModel
      .findByIdAndUpdate(stringId, song, {
        new: true,
        overwrite: true,
        runValidators: true,
      })
      .exec();
    return doc ? this.toSongDTO(doc) : null;
  }

  async remove(id: number): Promise<number | null> {
    const stringId = id.toString();
    if (!Types.ObjectId.isValid(stringId)) {
      return null;
    }
    const result = await this.songModel.findByIdAndDelete(stringId).exec();
    return result ? 1 : 0;
  }

  /**
   * Converts a Mongoose document to a SongDTO
   */
  private toSongDTO(doc: SongDocument): SongDTO {
    return {
      id: parseInt(doc._id.toString(), 10),
      title: doc.title,
      artists: doc.artists,
      album: doc.album,
      year: doc.year,
      genres: doc.genres || [],
      duration: doc.duration,
      releaseDate: doc.releaseDate,
    };
  }
}
