import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CMLogger } from "src/common/logger";
import { Playlist, PlaylistSchema } from "./models/playlist.schema";
import { MongoPlaylistsRepository } from "./repositories/mongo-playlists.repository";
import { PLAYLISTS_REPOSITORY } from "./repositories/playlists.repository";
import { PlaylistsService } from "./playlists.service";
import { PlaylistsController } from "./playlists.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Playlist.name, schema: PlaylistSchema },
    ]),
  ],
  controllers: [PlaylistsController],
  providers: [
    PlaylistsService,
    CMLogger,
    MongoPlaylistsRepository,
    {
      provide: PLAYLISTS_REPOSITORY,
      useExisting: MongoPlaylistsRepository,
    },
  ],
  exports: [PlaylistsService],
})
export class PlaylistsModule {}
