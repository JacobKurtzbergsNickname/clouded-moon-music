import { Controller, Get, Param } from "@nestjs/common";
import { GenresService } from "./genres.service";

@Controller("genres")
export class GenresController {
  constructor(private genresService: GenresService) {}

  @Get()
  findAll() {
    return this.genresService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.genresService.findOne(id);
  }
}
