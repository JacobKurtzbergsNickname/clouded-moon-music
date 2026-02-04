import { Inject, Injectable } from "@nestjs/common";
import { CMLogger, ILogEntry } from "src/common/logger";
import CreateSongDTO from "./models/create-song.dto";
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

  findAll(): Promise<Song[]> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Getting all songs",
      context: "SongsService",
    };
    this.logger.info("Method: findAll()", logEntry);
    return this.songsRepository.findAll();
  }

  findOne(id: string): Promise<Song | null> {
    console.log("Id: ", id);
    return this.songsRepository.findOne(id);
  }

  create(dto: CreateSongDTO): Promise<Song> {
    return this.songsRepository.create(dto);
  }

  update(id: string, song: Partial<CreateSongDTO>): Promise<Song | null> {
    return this.songsRepository.update(id, song);
  }

  replace(id: string, song: CreateSongDTO): Promise<Song | null> {
    return this.songsRepository.replace(id, song);
  }

  remove(id: string): Promise<string | null> {
    return this.songsRepository.remove(id);
  }
}
