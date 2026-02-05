import { Controller, Get, Param } from "@nestjs/common";
import { ArtistsService } from "./artists.service";

@Controller("artists")
export class ArtistsController {
  constructor(private artistsService: ArtistsService) {}

  @Get()
  findAll() {
    return this.artistsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.artistsService.findOne(id);
  }
}
