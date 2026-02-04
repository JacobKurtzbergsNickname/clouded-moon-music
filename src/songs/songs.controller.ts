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
import { SongsService } from "./songs.service";
import CreateSongDTO from "./models/create-song.dto";

@Controller("songs")
export class SongsController {
  constructor(private songsService: SongsService) {}

  @Post()
  create(@Body() song: CreateSongDTO) {
    return this.songsService.create(song);
  }

  @Get()
  findAll() {
    return this.songsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.songsService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() song: Partial<CreateSongDTO>) {
    return this.songsService.update(id, song);
  }

  @Put(":id")
  replace(@Param("id") id: string, @Body() song: CreateSongDTO) {
    return this.songsService.replace(id, song);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.songsService.remove(id);
  }
}
