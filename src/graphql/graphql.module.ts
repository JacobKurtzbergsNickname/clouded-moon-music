import { Module } from "@nestjs/common";
import { SongsModule } from "../songs/songs.module";
import { ArtistsModule } from "../artists/artists.module";
import { AlbumsModule } from "../albums/albums.module";
import { GenresModule } from "../genres/genres.module";
import { SongsResolver } from "./resolvers/songs.resolver";
import { ArtistsResolver } from "./resolvers/artists.resolver";
import { AlbumsResolver } from "./resolvers/albums.resolver";
import { GenresResolver } from "./resolvers/genres.resolver";
import {
  GraphqlSongsService,
  GraphqlArtistsService,
  GraphqlAlbumsService,
  GraphqlGenresService,
} from "./graphql.service";
import { DataLoadersService } from "./dataloaders/dataloaders.service";

@Module({
  imports: [SongsModule, ArtistsModule, AlbumsModule, GenresModule],
  providers: [
    SongsResolver,
    ArtistsResolver,
    AlbumsResolver,
    GenresResolver,
    GraphqlSongsService,
    GraphqlArtistsService,
    GraphqlAlbumsService,
    GraphqlGenresService,
    DataLoadersService,
  ],
})
export class GraphQLModule {}
