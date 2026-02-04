/**
 * Data Transfer Object for Song
 * Common DTO type used by all repository implementations.
 * Uses string arrays for artists and genres to be compatible
 * with both MongoDB (which stores them as strings) and SQL
 * (which can convert from entity relations).
 */
export class SongDTO {
  id: number;
  title: string;
  artists: string[];
  album: string;
  year: number;
  genres: string[];
  duration: number;
  releaseDate: Date;
}
