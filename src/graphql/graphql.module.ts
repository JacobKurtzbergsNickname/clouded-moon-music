import { Module } from "@nestjs/common";
import { SongsModule } from "../songs/songs.module";
import { SongsResolver } from "./resolvers/songs.resolver";
import { GraphqlSongsService } from "./graphql.service";

@Module({
  imports: [SongsModule],
  providers: [SongsResolver, GraphqlSongsService],
})
export class GraphqlModule {}
