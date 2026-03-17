import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CMLogger } from "src/common/logger";
import { Track } from "./models/track.entity";
import { TracksController } from "./tracks.controller";
import { TracksService } from "./tracks.service";
import { TRACKS_REPOSITORY } from "./repositories/tracks.repository";
import { SqlTracksRepository } from "./repositories/sql-tracks.repository";
import { StorageModule } from "../storage/storage.module";
import { RedisModule } from "../redis/redis.module";

@Module({
  imports: [TypeOrmModule.forFeature([Track]), StorageModule, RedisModule],
  controllers: [TracksController],
  providers: [
    TracksService,
    CMLogger,
    SqlTracksRepository,
    {
      provide: TRACKS_REPOSITORY,
      useExisting: SqlTracksRepository,
    },
  ],
  exports: [TracksService],
})
export class TracksModule {}
