import { Inject, Injectable } from "@nestjs/common";
import { CreateSongDTO } from "./models/create-song.dto";
import { Song } from "./models/song.entity";
import { ISong } from "./models/song.interface";
import { CMLogger, ILogEntry } from "src/common/logger";
import { SongsRepository, SONGS_REPOSITORY } from "./repositories/songs.repository";

@Injectable()
export class SongsService {

  private readonly logger: CMLogger;
  constructor(
    @Inject(SONGS_REPOSITORY) private readonly songsRepository: SongsRepository,
    logger: CMLogger,
  ) {
    this.logger = logger;
  }

  findAll(): Array<Song> {
    const logEntry: ILogEntry = {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Getting all songs',
        context: 'SongsService'
    };
    this.logger.info("Method: findAll()", logEntry);
    return this.songsRepository.findAll();
  }

  findOne(id: number): Song | string {
    console.log("Id: ", id);
    return this.songsRepository.findOne(id);
  }

  create(dto: CreateSongDTO): ISong {
    return this.songsRepository.create(dto);
  }

  update(id: number, song: Omit<Song, "id">): Song {
    return this.songsRepository.update(id, song);
  }

  replace(id: number, song: Song): Song {
    return this.songsRepository.replace(id, song);
  }

  remove(id: number): number | null {
    return this.songsRepository.remove(id);
  }
}
