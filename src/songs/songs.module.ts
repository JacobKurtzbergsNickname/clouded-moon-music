import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SongsController } from "./songs.controller";
import { SongsService } from "./songs.service";
import { CMLogger } from "src/common/logger";
import { Song, SongSchema } from "./models/song.schema";
import { MongoSongsRepository } from "./repositories/mongo-songs.repository";

@Module({
  imports: [MongooseModule.forFeature([{ name: Song.name, schema: SongSchema }])],
  controllers: [SongsController],
  providers: [SongsService, CMLogger, MongoSongsRepository],
})
export class SongsModule {}
