import { ApiProperty } from "@nestjs/swagger";

/**
 * Data Transfer Object for Genre
 * Flattens the songs relation to avoid circular references during JSON serialization.
 * Returns song titles as a simple array instead of full Song entities.
 */
export class GenreDTO {
  @ApiProperty({
    description: "The unique identifier of the genre",
    example: "1",
  })
  id: string;

  @ApiProperty({
    description: "The name of the genre",
    example: "Rock",
  })
  name: string;

  @ApiProperty({
    description: "List of song titles in this genre",
    example: ["Bohemian Rhapsody", "Stairway to Heaven"],
    type: [String],
  })
  songs: string[];
}
