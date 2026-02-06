import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from "@nestjs/graphql";
import { GraphqlSongsService } from "../graphql.service";
import { SongType } from "../models/song.type";
import { ArtistType } from "../models/artist.type";
import { GenreType } from "../models/genre.type";
import { CreateSongInput, UpdateSongInput } from "../models/song.input";
import { DataLoadersService } from "../dataloaders/dataloaders.service";
import { SongDTO } from "../../songs/models/song.dto";

@Resolver(() => SongType)
export class SongsResolver {
  constructor(
    private readonly graphqlSongsService: GraphqlSongsService,
    private readonly dataLoadersService: DataLoadersService,
  ) {}

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

  @ResolveField(() => [ArtistType], { name: "artists" })
  async artists(@Parent() song: SongType): Promise<ArtistType[]> {
    // Parent receives DTO structure from service with artists as string[]
    // Type cast is necessary because GraphQL type system expects SongType
    // but runtime data is still DTO until field resolvers complete
    const artistIds = (song as any).artists || [];
    const artists = await Promise.all(
      artistIds.map((id: string) => this.dataLoadersService.artistLoader.load(id)),
    );
    // Filter out nulls
    return artists.filter((artist): artist is ArtistType => artist !== null);
  }

  @ResolveField(() => [GenreType], { name: "genres", nullable: true })
  async genres(@Parent() song: SongType): Promise<GenreType[] | null> {
    // Parent receives DTO structure from service with genres as string[] | undefined
    // Type cast is necessary because GraphQL type system expects SongType
    // but runtime data is still DTO until field resolvers complete
    const genreIds = (song as any).genres;
    if (!genreIds) return null;

    // Use DataLoader to batch-load genres from string IDs
    const genres = await Promise.all(
      genreIds.map((id: string) => this.dataLoadersService.genreLoader.load(id)),
    );
    // Filter out nulls
    return genres.filter((genre): genre is GenreType => genre !== null);
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
