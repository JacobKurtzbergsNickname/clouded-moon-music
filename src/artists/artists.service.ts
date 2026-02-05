import { Inject, Injectable } from "@nestjs/common";
import { CMLogger, ILogEntry } from "src/common/logger";
import {
  ArtistsRepository,
  ARTISTS_REPOSITORY,
} from "./repositories/artists.repository";
import { Artist } from "./models/artist.entity";

@Injectable()
export class ArtistsService {
  private readonly logger: CMLogger;

  constructor(
    @Inject(ARTISTS_REPOSITORY)
    private readonly artistsRepository: ArtistsRepository,
    logger: CMLogger,
  ) {
    this.logger = logger;
  }

  findAll(): Promise<Artist[]> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Getting all artists",
      context: "ArtistsService",
    };
    this.logger.info("Method: findAll()", logEntry);
    return this.artistsRepository.findAll();
  }

  findOne(id: string): Promise<Artist | null> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Finding artist with id: ${id}`,
      context: "ArtistsService",
    };
    this.logger.info("Method: findOne()", logEntry);
    return this.artistsRepository.findOne(id);
  }
}
