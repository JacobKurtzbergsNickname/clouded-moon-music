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
  update(@Param("id") id: string) {
    const updatedSong: Partial<CreateSongDTO> = {
      title: "Helvegen",
      artists: ["Wardruna"],
      album: "Runaljod - Yggdrasil",
      year: 2013,
      genres: ["Nordic Folk"],
      duration: 561, // 9:21 in seconds
      releaseDate: new Date("2013-01-01T00:00:00Z"),
    };
    return this.songsService.update(id, updatedSong);
  }

  @Put(":id")
  replace(@Param("id") id: string) {
    const song: CreateSongDTO = {
      title: "Helvegen",
      artists: ["Wardruna"],
      album: "Runaljod - Yggdrasil",
      year: 2013,
      genres: ["Nordic Folk"],
      duration: 561, // 9:21 in seconds
      releaseDate: new Date("2013-01-01T00:00:00Z"),
    };
    return this.songsService.replace(id, song);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.songsService.remove(id);
  }
}
