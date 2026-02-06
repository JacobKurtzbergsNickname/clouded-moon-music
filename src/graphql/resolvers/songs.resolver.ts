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

/**
 * Runtime structure of parent object in field resolvers.
 * Represents the DTO structure with string arrays for relationships,
 * which will be resolved to proper GraphQL types by @ResolveField.
 */
type SongDTORuntime = Omit<SongType, "artists" | "genres"> & {
  artists?: string[];
  genres?: string[];
};

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
    // Cast to SongDTORuntime to maintain type safety while accessing DTO fields
    const songRuntime = song as unknown as SongDTORuntime;
    const artistIds = songRuntime.artists || [];
    const artists = await Promise.all(
      artistIds.map((id: string) => this.dataLoadersService.artistLoader.load(id)),
    );
    // Filter out nulls
    return artists.filter((artist): artist is ArtistType => artist !== null);
  }

  @ResolveField(() => [GenreType], { name: "genres", nullable: true })
  async genres(@Parent() song: SongType): Promise<GenreType[] | null> {
    // Parent receives DTO structure from service with genres as string[] | undefined
    // Cast to SongDTORuntime to maintain type safety while accessing DTO fields
    const songRuntime = song as unknown as SongDTORuntime;
    const genreIds = songRuntime.genres;
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
