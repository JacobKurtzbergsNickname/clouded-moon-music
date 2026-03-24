import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Playlist, PlaylistDocument } from "../models/playlist.schema";
import { CreatePlaylistDTO } from "../models/create-playlist.dto";
import { PlaylistDTO } from "../models/playlist.dto";
import { PlaylistsRepository } from "./playlists.repository";

@Injectable()
export class MongoPlaylistsRepository implements PlaylistsRepository {
  constructor(
    @InjectModel(Playlist.name)
    private readonly playlistModel: Model<PlaylistDocument>,
  ) {}

  async findAll(): Promise<PlaylistDTO[]> {
    const docs = await this.playlistModel.find().exec();
    return docs.map((doc) => this.toDTO(doc));
  }

  async findOne(id: string): Promise<PlaylistDTO | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await this.playlistModel.findById(id).exec();
    return doc ? this.toDTO(doc) : null;
  }

  async findByIds(ids: string[]): Promise<(PlaylistDTO | null)[]> {
    if (ids.length === 0) {
      return [];
    }
    const validIds = ids.filter((id) => Types.ObjectId.isValid(id));
    const docs = await this.playlistModel
      .find({ _id: { $in: validIds } })
      .exec();

    const docMap = new Map(docs.map((doc) => [doc._id.toString(), doc]));

    return ids.map((id) => {
      if (!Types.ObjectId.isValid(id)) return null;
      const doc = docMap.get(id);
      return doc ? this.toDTO(doc) : null;
    });
  }

  async create(dto: CreatePlaylistDTO): Promise<PlaylistDTO> {
    const created = new this.playlistModel({
      name: dto.name,
      description: dto.description,
      songs: dto.songs ?? [],
    });
    const doc = await created.save();
    return this.toDTO(doc);
  }

  async update(
    id: string,
    dto: Partial<CreatePlaylistDTO>,
  ): Promise<PlaylistDTO | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await this.playlistModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    return doc ? this.toDTO(doc) : null;
  }

  async remove(id: string): Promise<string | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const result = await this.playlistModel.findByIdAndDelete(id).exec();
    return result ? id : null;
  }

  async addSong(id: string, songId: string): Promise<PlaylistDTO | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await this.playlistModel
      .findByIdAndUpdate(id, { $addToSet: { songs: songId } }, { new: true })
      .exec();
    return doc ? this.toDTO(doc) : null;
  }

  async removeSong(id: string, songId: string): Promise<PlaylistDTO | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await this.playlistModel
      .findByIdAndUpdate(id, { $pull: { songs: songId } }, { new: true })
      .exec();
    return doc ? this.toDTO(doc) : null;
  }

  private toDTO(doc: PlaylistDocument): PlaylistDTO {
    return {
      id: doc._id.toString(),
      name: doc.name,
      description: doc.description,
      songs: doc.songs,
    };
  }
}
