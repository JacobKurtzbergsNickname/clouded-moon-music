import { Args, ID, Mutation, Query, Resolver } from "@nestjs/graphql";
import { GraphqlSongsService } from "../graphql.service";
import { SongType } from "../models/song.type";
import { CreateSongInput, UpdateSongInput } from "../models/song.input";

@Resolver(() => SongType)
export class SongsResolver {
  constructor(private readonly graphqlSongsService: GraphqlSongsService) {}

  @Query(() => [SongType], { name: "songs" })
  findAll(): Promise<SongType[]> {
    return this.graphqlSongsService.findAll();
  }

  @Query(() => SongType, { name: "song", nullable: true })
  findOne(
    @Args("id", { type: () => ID }) id: string,
  ): Promise<SongType | null> {
    return this.graphqlSongsService.findOne(id);
  }

  @Mutation(() => SongType, { name: "createSong" })
  create(@Args("input") input: CreateSongInput): Promise<SongType> {
    return this.graphqlSongsService.create(input);
  }

  @Mutation(() => SongType, { name: "updateSong", nullable: true })
  update(
    @Args("id", { type: () => ID }) id: string,
    @Args("input") input: UpdateSongInput,
  ): Promise<SongType | null> {
    return this.graphqlSongsService.update(id, input);
  }

  @Mutation(() => ID, { name: "removeSong", nullable: true })
  remove(@Args("id", { type: () => ID }) id: string): Promise<string | null> {
    return this.graphqlSongsService.remove(id);
  }
}
