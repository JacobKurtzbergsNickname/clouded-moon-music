import { Controller, Get, Param } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ArtistsService } from "./artists.service";
import { ArtistDTO } from "./models/artist.dto";

@ApiTags("artists")
@Controller("artists")
export class ArtistsController {
  constructor(private artistsService: ArtistsService) {}

  @Get()
  @ApiOperation({ summary: "Get all artists" })
  @ApiResponse({
    status: 200,
    description: "List of all artists with their songs",
    type: [ArtistDTO],
  })
  findAll() {
    return this.artistsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get artist by ID" })
  @ApiResponse({
    status: 200,
    description: "Artist with the specified ID",
    type: ArtistDTO,
  })
  @ApiResponse({ status: 404, description: "Artist not found" })
  findOne(@Param("id") id: string) {
    return this.artistsService.findOne(id);
  }
}
