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
import { AlbumType } from "../models/album.type";
import { GenreType } from "../models/genre.type";
import { CreateSongInput, UpdateSongInput } from "../models/song.input";
import { DataLoadersService } from "../dataloaders/dataloaders.service";

/**
 * Runtime structure of parent object in field resolvers.
 * Represents the DTO structure with string arrays for relationships,
 * which will be resolved to proper GraphQL types by @ResolveField.
 */
type SongDTORuntime = Omit<SongType, "artists" | "genres" | "album"> & {
  artists?: string[];
  genres?: string[];
  album?: string;
};

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

  @ResolveField(() => AlbumType, { name: "album", nullable: true })
  async album(@Parent() song: SongType): Promise<AlbumType | null> {
    const songRuntime = song as unknown as SongDTORuntime;
    const albumRef = songRuntime.album;
    if (!albumRef) return null;

    // Legacy data stores album titles as plain strings; short-circuit before DB lookup
    if (typeof albumRef === "string" && /\D/.test(albumRef.trim())) {
      const title = albumRef.trim();
      if (!title) return null;
      return { id: title, title } as AlbumType;
    }

    const normalizedAlbumId =
      typeof albumRef === "string" ? albumRef.trim() : String(albumRef);
    if (!normalizedAlbumId) return null;

    const album =
      await this.dataLoadersService.albumLoader.load(normalizedAlbumId);
    if (album) return album;

    // Fallback for legacy strings that look like IDs but have no album record
    return { id: normalizedAlbumId, title: albumRef } as AlbumType;
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
  create(@Args("input") input: CreateSongInput): Promise<SongRawGqlType> {
    return this.graphqlSongsService.create(input);
  }

  @Mutation(() => SongType, { name: "updateSong", nullable: true })
  update(
    @Args("id", { type: () => ID }) id: string,
    @Args("input") input: UpdateSongInput,
  ): Promise<SongRawGqlType | null> {
    return this.graphqlSongsService.update(id, input);
  }

  @Mutation(() => ID, { name: "removeSong", nullable: true })
  remove(@Args("id", { type: () => ID }) id: string): Promise<string | null> {
    return this.graphqlSongsService.remove(id);
  }
}
