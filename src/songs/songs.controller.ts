import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { SongsService } from "./songs.service";
import CreateSongDTO from "./models/create-song.dto";

@ApiTags("songs")
@Controller("songs")
export class SongsController {
  constructor(private songsService: SongsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new song" })
  @ApiResponse({ status: 201, description: "Song created successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiBody({ type: CreateSongDTO })
  create(@Body() song: CreateSongDTO) {
    return this.songsService.create(song);
  }

  @Get()
  @ApiOperation({ summary: "Get all songs" })
  @ApiResponse({ status: 200, description: "Returns all songs" })
  findAll() {
    return this.songsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a song by id" })
  @ApiParam({ name: "id", description: "Song ID" })
  @ApiResponse({ status: 200, description: "Returns the song" })
  @ApiResponse({ status: 404, description: "Song not found" })
  findOne(@Param("id") id: string) {
    return this.songsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a song partially" })
  @ApiParam({ name: "id", description: "Song ID" })
  @ApiBody({ type: CreateSongDTO })
  @ApiResponse({ status: 200, description: "Song updated successfully" })
  @ApiResponse({ status: 404, description: "Song not found" })
  update(@Param("id") id: string, @Body() song: Partial<CreateSongDTO>) {
    return this.songsService.update(id, song);
  }

  @Put(":id")
  @ApiOperation({ summary: "Replace a song completely" })
  @ApiParam({ name: "id", description: "Song ID" })
  @ApiBody({ type: CreateSongDTO })
  @ApiResponse({ status: 200, description: "Song replaced successfully" })
  @ApiResponse({ status: 404, description: "Song not found" })
  replace(@Param("id") id: string, @Body() song: CreateSongDTO) {
    return this.songsService.replace(id, song);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a song" })
  @ApiParam({ name: "id", description: "Song ID" })
  @ApiResponse({ status: 200, description: "Song deleted successfully" })
  @ApiResponse({ status: 404, description: "Song not found" })
  remove(@Param("id") id: string) {
    return this.songsService.remove(id);
  }
}
