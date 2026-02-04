import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Song, SongDocument } from "../models/song.schema";
import { Song as SongEntity } from "../models/song.entity";
import CreateSongDTO from "../models/create-song.dto";
import { SongsRepository } from "./songs.repository";

@Injectable()
export class MongoSongsRepository implements SongsRepository {
  constructor(
    @InjectModel(Song.name) private readonly songModel: Model<SongDocument>,
  ) {}

  async findAll(): Promise<SongEntity[]> {
    const docs = await this.songModel.find().exec();
    return docs.map((doc) => this.toSong(doc));
  }

  async findOne(id: number): Promise<SongEntity | null> {
    const stringId = id.toString();
    if (!Types.ObjectId.isValid(stringId)) {
      return null;
    }
    const doc = await this.songModel.findById(stringId).exec();
    return doc ? this.toSong(doc) : null;
  }

  async create(dto: CreateSongDTO): Promise<SongEntity> {
    const createdSong = new this.songModel(dto);
    const doc = await createdSong.save();
    return this.toSong(doc);
  }

  async update(
    id: number,
    song: Partial<CreateSongDTO>,
  ): Promise<SongEntity | null> {
    const stringId = id.toString();
    if (!Types.ObjectId.isValid(stringId)) {
      return null;
    }
    const doc = await this.songModel
      .findByIdAndUpdate(stringId, song, { new: true })
      .exec();
    return doc ? this.toSong(doc) : null;
  }

  async replace(id: number, song: CreateSongDTO): Promise<SongEntity | null> {
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
    return doc ? this.toSong(doc) : null;
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
   * Converts a Mongoose document to a plain Song entity object
   */
  private toSong(doc: SongDocument): SongEntity {
    const song = new SongEntity();
    song.id = parseInt(doc._id.toString(), 10);
    song.title = doc.title;
    song.artists = doc.artists as any; // MongoDB stores as string[], entity expects Artist[]
    song.album = doc.album;
    song.year = doc.year;
    song.genres = doc.genres as any; // MongoDB stores as string[], entity expects Genre[]
    song.duration = doc.duration;
    song.releaseDate = doc.releaseDate;
    return song;
  }
}
