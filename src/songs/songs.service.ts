import { Injectable } from "@nestjs/common";
import { CreateSongDTO } from "./models/create-song.dto";
import { plainToClass } from "class-transformer";
import { Song } from "./models/song.entity";
import { ISong } from "./models/song.interface";
import { CMLogger, ILogEntry } from "src/common/logger";

@Injectable()
export class SongsService {

  private readonly logger: CMLogger;
  constructor(logger: CMLogger) {
    this.logger = logger;
  }

  // Mockup data
  private songs: Array<Song> = [
    {
      id: 0,
      title: "Dickichtgott",
      artists: ["Helrunar"],
      album: "Baldr Ok Íss",
      year: 2006,
      genres: ["Black Metal"],
      duration: new Date("02:34"),
      releaseDate: new Date("2006-01-01T00:00:00Z"),
    },
    {
      id: 1,
      title: "The Call of the Mountains",
      artists: ["Eluveitie"],
      album: "Origins",
      year: 2014,
      genres: ["Folk Metal"],
      duration: new Date("03:15"),
      releaseDate: new Date("2014-01-01T00:00:00Z"),
    },
    {
      id: 3,
      title: "In Maidjan",
      artists: ["Heilung"],
      album: "Ofnir",
      year: 2015,
      genres: ["Neofolk"],
      duration: new Date("05:39"),
      releaseDate: new Date("2015-01-01T00:00:00Z"),
    },
    {
      id: 4,
      title: "Row Row",
      artists: ["Zeal & Ardor"],
      album: "Stranger Fruit",
      year: 2018,
      genres: ["Black Metal", "Gospel"],
      duration: new Date("03:43"),
      releaseDate: new Date("2018-01-01T00:00:00Z"),
    },
  ];

  findAll(): Array<Song> {
    const logEntry: ILogEntry = {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Getting all songs',
        context: 'SongsService'
    };
    this.logger.info("Method: findAll()", logEntry);
    return this.songs;
  }

  findOne(id: number): Song | string {
    console.log("Id: ", id);
    const song = this.songs.find((song) => song.id === id);
    if (!song) {
      return "Not found";
    }
    return song;
  }

  create(dto: CreateSongDTO): ISong {
    const song = plainToClass(Song, dto);
    song.id = this.songs.length + 1;
    this.songs.push(song);
    this.songs = this.songs.map((song, index) => ({ ...song, id: index }));
    return song;
  }

  update(id: number, song: Omit<Song, "id">): Song {
    this.songs = this.songs.map((s) => {
      if (s.id === id) {
        return { ...s, ...song };
      }
      return s;
    });
    return { ...song, id };
  }

  replace(id: number, song: Song): Song {
    this.songs = this.songs.map((s) => {
      if (s.id === id) {
        return song;
      }
      return s;
    });
    return song;
  }

  remove(id: number): number {
    const song = this.songs.find((song) => song.id === id);
    if (!song) {
      return null;
    }
    this.songs = this.songs
      .filter((song) => song.id !== id)
      .map((song, index) => ({ ...song, id: index }));

    return song.id;
  }
}
