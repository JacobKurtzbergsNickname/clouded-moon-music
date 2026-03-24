import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from "@nestjs/graphql";
import { ArtistType } from "../models/artist.type";
import { SongType, SongRawGqlType } from "../models/song.type";
import { CreateArtistInput, UpdateArtistInput } from "../models/artist.input";
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

  @Mutation(() => ArtistType, { name: "createArtist" })
  create(@Args("input") input: CreateArtistInput): Promise<ArtistType> {
    return this.graphqlArtistsService.create(input.name);
  }

  @Mutation(() => ArtistType, { name: "updateArtist", nullable: true })
  update(
    @Args("id", { type: () => ID }) id: string,
    @Args("input") input: UpdateArtistInput,
  ): Promise<ArtistType | null> {
    return this.graphqlArtistsService.update(id, input.name);
  }

  @Mutation(() => ID, { name: "removeArtist", nullable: true })
  remove(@Args("id", { type: () => ID }) id: string): Promise<string | null> {
    return this.graphqlArtistsService.remove(id);
  }

  @ResolveField(() => [SongType], { name: "songs" })
  async songs(
    @Parent() artist: Pick<ArtistType, "id">,
  ): Promise<SongRawGqlType[]> {
    return this.dataLoadersService.songsByArtistLoader.load(artist.id);
  }
}
