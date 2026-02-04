import { Inject, Injectable } from "@nestjs/common";
import { CMLogger, ILogEntry } from "src/common/logger";
import { CreateSongDTO } from "./models/create-song.dto";
import { Song } from "./models/song.entity";
import {
  SongsRepository,
  SONGS_REPOSITORY,
} from "./repositories/songs.repository";

@Injectable()
export class SongsService {
  private readonly logger: CMLogger;

  constructor(
    @Inject(SONGS_REPOSITORY) private readonly songsRepository: SongsRepository,
    logger: CMLogger,
  ) {
    this.logger = logger;
  }

  async findAll(): Promise<Array<Song>> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Getting all songs",
      context: "SongsService",
    };
    this.logger.info("Method: findAll()", logEntry);
    return await this.songsRepository.findAll();
  }

  async findOne(id: number): Promise<Song | null> {
    console.log("Id: ", id);
    return await this.songsRepository.findOne(id);
  }

  async create(dto: CreateSongDTO): Promise<Song> {
    return await this.songsRepository.create(dto);
  }

  async update(id: number, song: Omit<Song, "id">): Promise<Song | null> {
    return await this.songsRepository.update(id, song);
  }

  async replace(id: number, song: Song): Promise<Song | null> {
    return await this.songsRepository.replace(id, song);
  }

  async remove(id: number): Promise<number | null> {
    return await this.songsRepository.remove(id);
  }
}
