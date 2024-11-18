import { ISong } from "./song.interface";

export class Song implements ISong {
  id: number;
  title: string;
  artists: Array<string>;
  album: string;
  year: number;
  genres: Array<string>;
  duration: Date;
  releaseDate: Date;
}
