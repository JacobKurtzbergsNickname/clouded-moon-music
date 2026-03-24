import { Controller, Get, Param } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AlbumsService } from "./albums.service";
import { AlbumDTO } from "./models/album.dto";

@ApiTags("albums")
@Controller("albums")
export class AlbumsController {
  constructor(private albumsService: AlbumsService) {}

  @Get()
  @ApiOperation({ summary: "Get all albums" })
  @ApiResponse({
    status: 200,
    description: "List of all albums",
    type: [AlbumDTO],
  })
  findAll() {
    return this.albumsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get album by ID" })
  @ApiResponse({
    status: 200,
    description: "Album with the specified ID",
    type: AlbumDTO,
  })
  @ApiResponse({ status: 404, description: "Album not found" })
  findOne(@Param("id") id: string) {
    return this.albumsService.findOne(id);
  }
}
