import { Inject, Injectable } from "@nestjs/common";
import { CMLogger, ILogEntry } from "src/common/logger";
import CreateSongDTO from "./models/create-song.dto";
import {
  SongsRepository,
  SONGS_REPOSITORY,
} from "./repositories/songs.repository";
import { SongDTO } from "./models/song.dto";

@Injectable()
export class SongsService {
  private readonly logger: CMLogger;

  constructor(
    @Inject(SONGS_REPOSITORY) private readonly songsRepository: SongsRepository,
    logger: CMLogger,
  ) {
    this.logger = logger;
  }

  findAll(): Promise<SongDTO[]> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Getting all songs",
      context: "SongsService",
    };
    this.logger.info("Method: findAll()", logEntry);
    return this.songsRepository.findAll();
  }

  findOne(id: string): Promise<SongDTO | null> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Finding song with id: ${id}`,
      context: "SongsService",
    };
    this.logger.info("Method: findOne()", logEntry);
    return this.songsRepository.findOne(id);
  }

  create(dto: CreateSongDTO): Promise<SongDTO> {
    return this.songsRepository.create(dto);
  }

  update(id: string, song: Partial<CreateSongDTO>): Promise<SongDTO | null> {
    return this.songsRepository.update(id, song);
  }

  replace(id: string, song: CreateSongDTO): Promise<SongDTO | null> {
    return this.songsRepository.replace(id, song);
  }

  remove(id: string): Promise<string | null> {
    return this.songsRepository.remove(id);
  }
}
