import { Inject, Injectable } from "@nestjs/common";
import { CMLogger, ILogEntry } from "src/common/logger";
import {
  GenresRepository,
  GENRES_REPOSITORY,
} from "./repositories/genres.repository";
import { Genre } from "./models/genre.entity";

@Injectable()
export class GenresService {
  private readonly logger: CMLogger;

  constructor(
    @Inject(GENRES_REPOSITORY)
    private readonly genresRepository: GenresRepository,
    logger: CMLogger,
  ) {
    this.logger = logger;
  }

  findAll(): Promise<Genre[]> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Getting all genres",
      context: "GenresService",
    };
    this.logger.info("Method: findAll()", logEntry);
    return this.genresRepository.findAll();
  }

  findOne(id: string): Promise<Genre | null> {
    const logEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Finding genre with id: ${id}`,
      context: "GenresService",
    };
    this.logger.info("Method: findOne()", logEntry);
    return this.genresRepository.findOne(id);
  }
}
