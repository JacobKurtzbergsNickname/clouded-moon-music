import { Module } from "@nestjs/common";
import { CMLogger } from "src/common/logger";
import { SongsController } from "./songs.controller";
import { SongsService } from "./songs.service";
import { MongoSongsRepository } from "./repositories/mongo-songs.repository";
import {
  MONGO_SONGS_REPOSITORY,
  SONGS_REPOSITORY,
  SQL_SONGS_REPOSITORY,
} from "./repositories/songs.repository";
import { SqlSongsRepository } from "./repositories/sql-songs.repository";

@Module({
  controllers: [SongsController],
  providers: [
    SongsService,
    CMLogger,
    MongoSongsRepository,
    SqlSongsRepository,
    {
      provide: SONGS_REPOSITORY,
      useExisting: MongoSongsRepository,
    },
    {
      provide: MONGO_SONGS_REPOSITORY,
      useExisting: MongoSongsRepository,
    },
    {
      provide: SQL_SONGS_REPOSITORY,
      useExisting: SqlSongsRepository,
    },
  ],
})
export class SongsModule {}
