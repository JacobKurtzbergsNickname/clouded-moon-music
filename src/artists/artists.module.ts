import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CMLogger } from "src/common/logger";
import { Artist } from "./models/artist.entity";
import { ArtistsController } from "./artists.controller";
import { ArtistsService } from "./artists.service";
import {
  ARTISTS_REPOSITORY,
  SQL_ARTISTS_REPOSITORY,
} from "./repositories/artists.repository";
import { SqlArtistsRepository } from "./repositories/sql-artists.repository";

@Module({
  imports: [TypeOrmModule.forFeature([Artist])],
  controllers: [ArtistsController],
  providers: [
    ArtistsService,
    CMLogger,
    SqlArtistsRepository,
    {
      provide: ARTISTS_REPOSITORY,
      useExisting: SqlArtistsRepository,
    },
    {
      provide: SQL_ARTISTS_REPOSITORY,
      useExisting: SqlArtistsRepository,
    },
  ],
  exports: [TypeOrmModule], // Export TypeOrmModule to allow other modules to inject Artist repository
})
export class ArtistsModule {}
