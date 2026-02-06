import { ApiProperty } from "@nestjs/swagger";

/**
 * Data Transfer Object for Song
 * Common DTO type used by all repository implementations.
 * Uses string ID for compatibility with both MongoDB ObjectId and SQL numeric IDs.
 * Uses string arrays for artists and genres to be compatible
 * with both MongoDB (which stores them as strings) and SQL
 * (which can convert from entity relations).
 */
export class SongDTO {
  @ApiProperty({
    description: "The unique identifier of the song",
    example: "507f1f77bcf86cd799439011",
  })
  id: string;

  @ApiProperty({
    description: "The title of the song",
    example: "Bohemian Rhapsody",
  })
  title: string;

  @ApiProperty({
    description: "List of artists for the song",
    example: ["Queen"],
    type: [String],
  })
  artists: string[];

  @ApiProperty({
    description: "The album name",
    example: "A Night at the Opera",
  })
  album: string;

  @ApiProperty({
    description: "The year the song was released",
    example: 1975,
  })
  year: number;

  @ApiProperty({
    description: "List of genres for the song",
    example: ["Rock", "Progressive Rock"],
    type: [String],
  })
  genres: string[];

  @ApiProperty({
    description: "Duration of the song in seconds",
    example: 354,
  })
  duration: number;

  @ApiProperty({
    description: "The release date of the song",
    example: "1975-10-31T00:00:00.000Z",
  })
  releaseDate: Date;
}
