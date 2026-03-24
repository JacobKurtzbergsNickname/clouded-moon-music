import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { PlaylistsService } from "./playlists.service";
import { CreatePlaylistDTO } from "./models/create-playlist.dto";

@ApiTags("playlists")
@Controller("playlists")
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new playlist" })
  @ApiResponse({ status: 201, description: "Playlist created successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiBody({ type: CreatePlaylistDTO })
  create(@Body() dto: CreatePlaylistDTO) {
    return this.playlistsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Get all playlists" })
  @ApiResponse({ status: 200, description: "Returns all playlists" })
  findAll() {
    return this.playlistsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a playlist by id" })
  @ApiParam({ name: "id", description: "Playlist ID" })
  @ApiResponse({ status: 200, description: "Returns the playlist" })
  @ApiResponse({ status: 404, description: "Playlist not found" })
  findOne(@Param("id") id: string) {
    return this.playlistsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a playlist" })
  @ApiParam({ name: "id", description: "Playlist ID" })
  @ApiBody({ type: CreatePlaylistDTO })
  @ApiResponse({ status: 200, description: "Playlist updated successfully" })
  @ApiResponse({ status: 404, description: "Playlist not found" })
  update(@Param("id") id: string, @Body() dto: Partial<CreatePlaylistDTO>) {
    return this.playlistsService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a playlist" })
  @ApiParam({ name: "id", description: "Playlist ID" })
  @ApiResponse({ status: 200, description: "Playlist deleted successfully" })
  @ApiResponse({ status: 404, description: "Playlist not found" })
  remove(@Param("id") id: string) {
    return this.playlistsService.remove(id);
  }

  @Post(":id/songs")
  @ApiOperation({ summary: "Add a song to a playlist" })
  @ApiParam({ name: "id", description: "Playlist ID" })
  @ApiBody({
    schema: {
      type: "object",
      properties: { songId: { type: "string" } },
      required: ["songId"],
    },
  })
  @ApiResponse({
    status: 200,
    description: "Song added to playlist successfully",
  })
  @ApiResponse({ status: 404, description: "Playlist not found" })
  addSong(@Param("id") id: string, @Body("songId") songId: string) {
    return this.playlistsService.addSong(id, songId);
  }

  @Delete(":id/songs/:songId")
  @ApiOperation({ summary: "Remove a song from a playlist" })
  @ApiParam({ name: "id", description: "Playlist ID" })
  @ApiParam({ name: "songId", description: "Song ID to remove" })
  @ApiResponse({
    status: 200,
    description: "Song removed from playlist successfully",
  })
  @ApiResponse({ status: 404, description: "Playlist not found" })
  removeSong(@Param("id") id: string, @Param("songId") songId: string) {
    return this.playlistsService.removeSong(id, songId);
  }
}
