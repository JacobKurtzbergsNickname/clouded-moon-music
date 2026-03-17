import { ApiProperty } from "@nestjs/swagger";

/**
 * Data Transfer Object for Album
 * Flattens the songs relation to avoid circular references during JSON serialization.
 * Returns song titles as a simple array instead of full Song entities.
 */
export class AlbumDTO {
  @ApiProperty({
    description: "The unique identifier of the album",
    example: "1",
  })
  id: string;

  @ApiProperty({
    description: "The title of the album",
    example: "A Night at the Opera",
  })
  title: string;

  @ApiProperty({
    description: "The year the album was released",
    example: 1975,
    required: false,
  })
  releaseYear?: number;

  @ApiProperty({
    description: "List of song titles on this album",
    example: ["Bohemian Rhapsody", "You're My Best Friend"],
    type: [String],
  })
  songs: string[];
}
