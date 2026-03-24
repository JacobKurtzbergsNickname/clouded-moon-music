import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from "@nestjs/graphql";
import { GenreType } from "../models/genre.type";
import { SongType, SongRawGqlType } from "../models/song.type";
import { CreateGenreInput, UpdateGenreInput } from "../models/genre.input";
import { GraphqlGenresService } from "../graphql.service";
import { DataLoadersService } from "../dataloaders/dataloaders.service";

@Resolver(() => GenreType)
export class GenresResolver {
  constructor(
    private readonly graphqlGenresService: GraphqlGenresService,
    private readonly dataLoadersService: DataLoadersService,
  ) {}

  @Query(() => [GenreType], { name: "genres" })
  findAll(): Promise<GenreType[]> {
    return this.graphqlGenresService.findAll();
  }

  @Query(() => GenreType, { name: "genre", nullable: true })
  findOne(
    @Args("id", { type: () => ID }) id: string,
  ): Promise<GenreType | null> {
    return this.graphqlGenresService.findOne(id);
  }

  @Mutation(() => GenreType, { name: "createGenre" })
  create(@Args("input") input: CreateGenreInput): Promise<GenreType> {
    return this.graphqlGenresService.create(input.name);
  }

  @Mutation(() => GenreType, { name: "updateGenre", nullable: true })
  update(
    @Args("id", { type: () => ID }) id: string,
    @Args("input") input: UpdateGenreInput,
  ): Promise<GenreType | null> {
    return this.graphqlGenresService.update(id, input.name);
  }

  @Mutation(() => ID, { name: "removeGenre", nullable: true })
  remove(@Args("id", { type: () => ID }) id: string): Promise<string | null> {
    return this.graphqlGenresService.remove(id);
  }

  @ResolveField(() => [SongType], { name: "songs" })
  async songs(
    @Parent() genre: Pick<GenreType, "id">,
  ): Promise<SongRawGqlType[]> {
    return this.dataLoadersService.songsByGenreLoader.load(genre.id);
  }
}
