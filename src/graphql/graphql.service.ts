import { Injectable } from "@nestjs/common";
import { SongsService } from "../songs/songs.service";
import CreateSongDTO from "../songs/models/create-song.dto";
import { SongDTO } from "../songs/models/song.dto";

@Injectable()
export class GraphqlSongsService {
  constructor(private readonly songsService: SongsService) {}

  findAll(): Promise<SongDTO[]> {
    return this.songsService.findAll();
  }

  findOne(id: string): Promise<SongDTO | null> {
    return this.songsService.findOne(id);
  }

  create(input: CreateSongDTO): Promise<SongDTO> {
    return this.songsService.create(input);
  }

  update(id: string, input: Partial<CreateSongDTO>): Promise<SongDTO | null> {
    return this.songsService.update(id, input);
  }

  remove(id: string): Promise<string | null> {
    return this.songsService.remove(id);
  }
}
