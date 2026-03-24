import {
  Args,
  ID,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from "@nestjs/graphql";
import { AlbumType } from "../models/album.type";
import { SongType } from "../models/song.type";
import { GraphqlAlbumsService } from "../graphql.service";
import { DataLoadersService } from "../dataloaders/dataloaders.service";

@Resolver(() => AlbumType)
export class AlbumsResolver {
  constructor(
    private readonly graphqlAlbumsService: GraphqlAlbumsService,
    private readonly dataLoadersService: DataLoadersService,
  ) {}

  @Query(() => [AlbumType], { name: "albums" })
  findAll(): Promise<AlbumType[]> {
    return this.graphqlAlbumsService.findAll();
  }

  @Query(() => AlbumType, { name: "album", nullable: true })
  findOne(
    @Args("id", { type: () => ID }) id: string,
  ): Promise<AlbumType | null> {
    return this.graphqlAlbumsService.findOne(id);
  }

  @ResolveField(() => [SongType], { name: "songs" })
  async songs(@Parent() album: Pick<AlbumType, "id">): Promise<SongType[]> {
    return this.dataLoadersService.songsByAlbumLoader.load(album.id);
  }
}
