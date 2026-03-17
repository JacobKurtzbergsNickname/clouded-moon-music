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
import { SongType, SongRawGqlType } from "../models/song.type";
import { ArtistType } from "../models/artist.type";
import { GenreType } from "../models/genre.type";
import { CreateSongInput, UpdateSongInput } from "../models/song.input";
import { DataLoadersService } from "../dataloaders/dataloaders.service";

@Resolver(() => SongType)
export class SongsResolver {
  constructor(
    private readonly graphqlSongsService: GraphqlSongsService,
    private readonly dataLoadersService: DataLoadersService,
  ) {}

  @Query(() => [SongType], { name: "songs" })
  findAll(): Promise<SongRawGqlType[]> {
    return this.graphqlSongsService.findAll();
  }

  @Query(() => SongType, { name: "song", nullable: true })
  findOne(
    @Args("id", { type: () => ID }) id: string,
  ): Promise<SongRawGqlType | null> {
    return this.graphqlSongsService.findOne(id);
  }

  @ResolveField(() => [ArtistType], { name: "artists" })
  async artists(@Parent() song: SongRawGqlType): Promise<ArtistType[]> {
    const artistIds = song.artists ?? [];
    const artists = await Promise.all(
      artistIds.map((id) => this.dataLoadersService.artistLoader.load(id)),
    );
    return artists.filter((artist): artist is ArtistType => artist !== null);
  }

  @ResolveField(() => [GenreType], { name: "genres", nullable: true })
  async genres(@Parent() song: SongRawGqlType): Promise<GenreType[] | null> {
    const genreIds = song.genres;
    if (!genreIds) return null;

    const genres = await Promise.all(
      genreIds.map((id) => this.dataLoadersService.genreLoader.load(id)),
    );
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
