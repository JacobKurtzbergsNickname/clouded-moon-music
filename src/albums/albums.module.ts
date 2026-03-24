import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CMLogger } from "src/common/logger";
import { Album } from "./models/album.entity";
import { AlbumsController } from "./albums.controller";
import { AlbumsService } from "./albums.service";
import {
  ALBUMS_REPOSITORY,
  SQL_ALBUMS_REPOSITORY,
} from "./repositories/albums.repository";
import { SqlAlbumsRepository } from "./repositories/sql-albums.repository";

@Module({
  imports: [TypeOrmModule.forFeature([Album])],
  controllers: [AlbumsController],
  providers: [
    AlbumsService,
    CMLogger,
    SqlAlbumsRepository,
    {
      provide: ALBUMS_REPOSITORY,
      useExisting: SqlAlbumsRepository,
    },
    {
      provide: SQL_ALBUMS_REPOSITORY,
      useExisting: SqlAlbumsRepository,
    },
  ],
  exports: [TypeOrmModule, AlbumsService],
})
export class AlbumsModule {}
