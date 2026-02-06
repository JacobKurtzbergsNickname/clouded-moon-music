import { Module } from "@nestjs/common";
import { SongsModule } from "../songs/songs.module";
import { ArtistsModule } from "../artists/artists.module";
import { GenresModule } from "../genres/genres.module";
import { SongsResolver } from "./resolvers/songs.resolver";
import { ArtistsResolver } from "./resolvers/artists.resolver";
import { GenresResolver } from "./resolvers/genres.resolver";
import {
  GraphqlSongsService,
  GraphqlArtistsService,
  GraphqlGenresService,
} from "./graphql.service";
import { DataLoadersService } from "./dataloaders/dataloaders.service";

@Module({
  imports: [SongsModule, ArtistsModule, GenresModule],
  providers: [
    SongsResolver,
    ArtistsResolver,
    GenresResolver,
    GraphqlSongsService,
    GraphqlArtistsService,
    GraphqlGenresService,
    DataLoadersService,
  ],
})
export class GraphqlModule {}
