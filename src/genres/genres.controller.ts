import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GenresService } from "./genres.service";
import { GenreDTO } from "./models/genre.dto";

@ApiTags("genres")
@Controller("genres")
export class GenresController {
  constructor(private genresService: GenresService) {}

  @Get()
  @ApiOperation({ summary: "Get all genres" })
  @ApiResponse({
    status: 200,
    description: "List of all genres with their songs",
    type: [GenreDTO],
  })
  findAll() {
    return this.genresService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get genre by ID" })
  @ApiResponse({
    status: 200,
    description: "Genre with the specified ID",
    type: GenreDTO,
  })
  @ApiResponse({ status: 404, description: "Genre not found" })
  async findOne(@Param("id") id: string) {
    const genre = await this.genresService.findOne(id);
    if (!genre) {
      throw new NotFoundException(`Genre with id ${id} not found`);
    }
    return genre;
  }
}
