import {
  Args,
  ID,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from "@nestjs/graphql";
import { ArtistType } from "../models/artist.type";
import { SongType } from "../models/song.type";
import { GraphqlArtistsService } from "../graphql.service";
import { DataLoadersService } from "../dataloaders/dataloaders.service";

@Resolver(() => ArtistType)
export class ArtistsResolver {
  constructor(
    private readonly graphqlArtistsService: GraphqlArtistsService,
    private readonly dataLoadersService: DataLoadersService,
  ) {}

  @Query(() => [ArtistType], { name: "artists" })
  findAll(): Promise<ArtistType[]> {
    return this.graphqlArtistsService.findAll();
  }

  @Query(() => ArtistType, { name: "artist", nullable: true })
  findOne(
    @Args("id", { type: () => ID }) id: string,
  ): Promise<ArtistType | null> {
    return this.graphqlArtistsService.findOne(id);
  }

  @ResolveField(() => [SongType], { name: "songs" })
  async songs(@Parent() artist: Pick<ArtistType, "id">): Promise<SongType[]> {
    // Use DataLoader to batch-load songs for this artist
    return this.dataLoadersService.songsByArtistLoader.load(artist.id);
  }
}
