import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CMLogger } from "src/common/logger";
import { Genre } from "./models/genre.entity";
import { GenresController } from "./genres.controller";
import { GenresService } from "./genres.service";
import {
  GENRES_REPOSITORY,
  SQL_GENRES_REPOSITORY,
} from "./repositories/genres.repository";
import { SqlGenresRepository } from "./repositories/sql-genres.repository";

@Module({
  imports: [TypeOrmModule.forFeature([Genre])],
  controllers: [GenresController],
  providers: [
    GenresService,
    CMLogger,
    SqlGenresRepository,
    {
      provide: GENRES_REPOSITORY,
      useExisting: SqlGenresRepository,
    },
    {
      provide: SQL_GENRES_REPOSITORY,
      useExisting: SqlGenresRepository,
    },
  ],
  exports: [TypeOrmModule, GenresService], // Export TypeOrmModule to allow other modules to inject Genre repository
})
export class GenresModule {}
