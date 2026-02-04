export interface ISong {
  id: number;
  title: string;
  artists: Array<string>;
  album: string;
  year: number;
  genres: Array<string>;
  duration: number;
  releaseDate: Date;
}
