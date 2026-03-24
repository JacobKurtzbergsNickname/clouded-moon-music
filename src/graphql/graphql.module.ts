import { Module } from "@nestjs/common";
import { SongsModule } from "../songs/songs.module";
import { ArtistsModule } from "../artists/artists.module";
import { AlbumsModule } from "../albums/albums.module";
import { GenresModule } from "../genres/genres.module";
import { PlaylistsModule } from "../playlists/playlists.module";
import { SongsResolver } from "./resolvers/songs.resolver";
import { ArtistsResolver } from "./resolvers/artists.resolver";
import { AlbumsResolver } from "./resolvers/albums.resolver";
import { GenresResolver } from "./resolvers/genres.resolver";
import { PlaylistsResolver } from "./resolvers/playlists.resolver";
import {
  GraphqlSongsService,
  GraphqlArtistsService,
  GraphqlAlbumsService,
  GraphqlGenresService,
  GraphqlPlaylistsService,
} from "./graphql.service";
import { DataLoadersService } from "./dataloaders/dataloaders.service";

@Module({
  imports: [
    SongsModule,
    ArtistsModule,
    GenresModule,
    PlaylistsModule,
    AlbumsModule,
  ],
  providers: [
    SongsResolver,
    ArtistsResolver,
    AlbumsResolver,
    GenresResolver,
    PlaylistsResolver,
    GraphqlSongsService,
    GraphqlArtistsService,
    GraphqlAlbumsService,
    GraphqlGenresService,
    GraphqlPlaylistsService,
    DataLoadersService,
  ],
})
export class GraphQLModule {}
