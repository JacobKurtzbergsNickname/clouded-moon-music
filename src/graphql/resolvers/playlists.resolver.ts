import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from "@nestjs/graphql";
import { PlaylistType } from "../models/playlist.type";
import { SongType } from "../models/song.type";
import {
  CreatePlaylistInput,
  UpdatePlaylistInput,
} from "../models/playlist.input";
import { DataLoadersService } from "../dataloaders/dataloaders.service";
import { GraphqlPlaylistsService } from "../graphql.service";

/**
 * Runtime structure of the parent playlist in field resolvers.
 * The DTO carries songs as string[] which get resolved to SongType[] by @ResolveField.
 */
type PlaylistDTORuntime = Omit<PlaylistType, "songs"> & {
  songs?: string[];
};

@Resolver(() => PlaylistType)
export class PlaylistsResolver {
  constructor(
    private readonly graphqlPlaylistsService: GraphqlPlaylistsService,
    private readonly dataLoadersService: DataLoadersService,
  ) {}

  @Query(() => [PlaylistType], { name: "playlists" })
  findAll(): Promise<PlaylistType[]> {
    return this.graphqlPlaylistsService.findAll();
  }

  @Query(() => PlaylistType, { name: "playlist", nullable: true })
  findOne(
    @Args("id", { type: () => ID }) id: string,
  ): Promise<PlaylistType | null> {
    return this.graphqlPlaylistsService.findOne(id);
  }

  @ResolveField(() => [SongType], { name: "songs" })
  async songs(@Parent() playlist: PlaylistType): Promise<SongType[]> {
    const playlistRuntime = playlist as unknown as PlaylistDTORuntime;
    const songIds = playlistRuntime.songs || [];
    const songs = await Promise.all(
      songIds.map((id: string) => this.dataLoadersService.songLoader.load(id)),
    );
    return songs.filter((song): song is SongType => song !== null);
  }

  @Mutation(() => PlaylistType, { name: "createPlaylist" })
  create(@Args("input") input: CreatePlaylistInput): Promise<PlaylistType> {
    return this.graphqlPlaylistsService.create(input);
  }

  @Mutation(() => PlaylistType, { name: "updatePlaylist", nullable: true })
  update(
    @Args("id", { type: () => ID }) id: string,
    @Args("input") input: UpdatePlaylistInput,
  ): Promise<PlaylistType | null> {
    return this.graphqlPlaylistsService.update(id, input);
  }

  @Mutation(() => ID, { name: "removePlaylist", nullable: true })
  remove(@Args("id", { type: () => ID }) id: string): Promise<string | null> {
    return this.graphqlPlaylistsService.remove(id);
  }

  @Mutation(() => PlaylistType, { name: "addSongToPlaylist", nullable: true })
  addSong(
    @Args("playlistId", { type: () => ID }) playlistId: string,
    @Args("songId", { type: () => ID }) songId: string,
  ): Promise<PlaylistType | null> {
    return this.graphqlPlaylistsService.addSong(playlistId, songId);
  }

  @Mutation(() => PlaylistType, {
    name: "removeSongFromPlaylist",
    nullable: true,
  })
  removeSong(
    @Args("playlistId", { type: () => ID }) playlistId: string,
    @Args("songId", { type: () => ID }) songId: string,
  ): Promise<PlaylistType | null> {
    return this.graphqlPlaylistsService.removeSong(playlistId, songId);
  }
}
