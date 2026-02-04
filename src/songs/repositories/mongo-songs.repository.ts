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
