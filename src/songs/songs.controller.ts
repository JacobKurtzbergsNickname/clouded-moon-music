import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
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
import { ParseObjectIdPipe } from "../common/pipes/parse-object-id.pipe";

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
  async findOne(@Param("id", ParseObjectIdPipe) id: string) {
    const song = await this.songsService.findOne(id);
    if (!song) {
      throw new NotFoundException(`Song with id ${id} not found`);
    }
    return song;
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a song partially" })
  @ApiParam({ name: "id", description: "Song ID" })
  @ApiBody({ type: CreateSongDTO })
  @ApiResponse({ status: 200, description: "Song updated successfully" })
  @ApiResponse({ status: 404, description: "Song not found" })
  async update(
    @Param("id", ParseObjectIdPipe) id: string,
    @Body() song: Partial<CreateSongDTO>,
  ) {
    const updated = await this.songsService.update(id, song);
    if (!updated) {
      throw new NotFoundException(`Song with id ${id} not found`);
    }
    return updated;
  }

  @Put(":id")
  @ApiOperation({ summary: "Replace a song completely" })
  @ApiParam({ name: "id", description: "Song ID" })
  @ApiBody({ type: CreateSongDTO })
  @ApiResponse({ status: 200, description: "Song replaced successfully" })
  @ApiResponse({ status: 404, description: "Song not found" })
  async replace(
    @Param("id", ParseObjectIdPipe) id: string,
    @Body() song: CreateSongDTO,
  ) {
    const replaced = await this.songsService.replace(id, song);
    if (!replaced) {
      throw new NotFoundException(`Song with id ${id} not found`);
    }
    return replaced;
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a song" })
  @ApiParam({ name: "id", description: "Song ID" })
  @ApiResponse({ status: 204, description: "Song deleted successfully" })
  @ApiResponse({ status: 404, description: "Song not found" })
  async remove(@Param("id", ParseObjectIdPipe) id: string) {
    const removed = await this.songsService.remove(id);
    if (!removed) {
      throw new NotFoundException(`Song with id ${id} not found`);
    }
  }
}
