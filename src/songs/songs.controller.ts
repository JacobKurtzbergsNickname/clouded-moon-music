import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
} from "@nestjs/common";
import { SongsService } from "./songs.service";
import { CreateSongDTO } from "./models/create-song.dto";
import { Song } from "./models/song.entity";

function validInt(): ParseIntPipe {
  return new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE });
}

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
  findOne(@Param("id", validInt()) id: number) {
    return this.songsService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id", validInt()) id: number) {
    const updatedSong: Omit<Song, "id"> = {
      title: "Helvegen",
      artists: ["Wardruna"],
      album: "Runaljod - Yggdrasil",
      year: 2013,
      genres: ["Nordic Folk"],
      duration: new Date("09:21"),
      releaseDate: new Date("2013-01-01T00:00:00Z"),
    };
    return this.songsService.update(id, updatedSong);
  }

  @Put(":id")
  replace(@Param("id", validInt()) id: number) {
    const song: Song = {
      id: id,
      title: "Helvegen",
      artists: ["Wardruna"],
      album: "Runaljod - Yggdrasil",
      year: 2013,
      genres: ["Nordic Folk"],
      duration: new Date("09:21"),
      releaseDate: new Date("2013-01-01T00:00:00Z"),
    };
    return this.songsService.replace(id, song);
  }

  @Delete(":id")
  remove(@Param("id", validInt()) id: number) {
    return this.songsService.remove(id);
  }
}
