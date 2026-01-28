import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CreateSongDTO } from "../models/create-song.dto";
import { Song, SongDocument } from "../models/song.schema";

@Injectable()
export class MongoSongsRepository {
  constructor(
    @InjectModel(Song.name) private readonly songModel: Model<SongDocument>,
  ) {}

  async findAll(): Promise<SongDocument[]> {
    return this.songModel.find().exec();
  }

  async findOne(id: string): Promise<SongDocument | null> {
    return this.songModel.findById(id).exec();
  }

  async create(song: CreateSongDTO): Promise<SongDocument> {
    const createdSong = new this.songModel(song);
    return createdSong.save();
  }

  async update(
    id: string,
    song: Partial<CreateSongDTO>,
  ): Promise<SongDocument | null> {
    return this.songModel
      .findByIdAndUpdate(id, song, { new: true })
      .exec();
  }

  async replace(id: string, song: CreateSongDTO): Promise<SongDocument | null> {
    return this.songModel
      .findOneAndReplace({ _id: id }, song, { new: true })
      .exec();
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.songModel.findByIdAndDelete(id).exec();
    return Boolean(result);
  }
}
