import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CMLogger } from "src/common/logger";
import {
  MONGO_SONGS_REPOSITORY,
  SONGS_REPOSITORY,
  SQL_SONGS_REPOSITORY,
} from "./repositories/songs.repository";
import { SqlSongsRepository } from "./repositories/sql-songs.repository";
import { SongsController } from "./songs.controller";
import { SongsService } from "./songs.service";
import { Song, SongSchema } from "./models/song.schema";
import { MongoSongsRepository } from "./repositories/mongo-songs.repository";
import { Song as SqlSong } from "./models/song.entity";
import { ArtistsModule } from "../artists/artists.module";
import { GenresModule } from "../genres/genres.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Song.name, schema: SongSchema }]),
    TypeOrmModule.forFeature([SqlSong]),
    ArtistsModule, // Import ArtistsModule to get access to Artist entity repository
    GenresModule, // Import GenresModule to get access to Genre entity repository
  ],
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
