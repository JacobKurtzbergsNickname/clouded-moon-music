import {
  Args,
  ID,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from "@nestjs/graphql";
import { GenreType } from "../models/genre.type";
import { SongType } from "../models/song.type";
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
    @Args("id", { type: () => ID }) id: number,
  ): Promise<GenreType | null> {
    return this.graphqlGenresService.findOne(String(id));
  }

  @ResolveField(() => [SongType], { name: "songs" })
  async songs(@Parent() genre: GenreType): Promise<SongType[]> {
    // Use DataLoader to batch-load songs for this genre
    return this.dataLoadersService.songsByGenreLoader.load(genre.id);
  }
}
