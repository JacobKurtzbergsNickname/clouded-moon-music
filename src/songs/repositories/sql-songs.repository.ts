import { Injectable } from "@nestjs/common";
import { CreateSongDTO } from "../models/create-song.dto";
import { Song } from "../models/song.entity";
import { ISong } from "../models/song.interface";
import { SongsRepository } from "./songs.repository";

@Injectable()
export class SqlSongsRepository implements SongsRepository {
  findAll(): Array<Song> {
    throw new Error("SQL repository not implemented.");
  }

  findOne(_id: number): Song | string {
    throw new Error("SQL repository not implemented.");
  }

  create(_dto: CreateSongDTO): ISong {
    throw new Error("SQL repository not implemented.");
  }

  update(_id: number, _song: Omit<Song, "id">): Song {
    throw new Error("SQL repository not implemented.");
  }

  replace(_id: number, _song: Song): Song {
    throw new Error("SQL repository not implemented.");
  }

  remove(_id: number): number | null {
    throw new Error("SQL repository not implemented.");
  }
}
