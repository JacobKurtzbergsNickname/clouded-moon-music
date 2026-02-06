import { ApiProperty } from "@nestjs/swagger";

/**
 * Data Transfer Object for Artist
 * Flattens the songs relation to avoid circular references during JSON serialization.
 * Returns song titles as a simple array instead of full Song entities.
 */
export class ArtistDTO {
  @ApiProperty({
    description: "The unique identifier of the artist",
    example: "1",
  })
  id: string;

  @ApiProperty({
    description: "The name of the artist",
    example: "Queen",
  })
  name: string;

  @ApiProperty({
    description: "List of song titles by this artist",
    example: ["Bohemian Rhapsody", "We Will Rock You"],
    type: [String],
  })
  songs: string[];
}
