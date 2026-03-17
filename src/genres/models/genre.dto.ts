import { ApiProperty } from "@nestjs/swagger";

/**
 * Data Transfer Object for Genre.
 * Flattens the songs relation to avoid circular references during JSON serialization.
 * The `songs` array contains song titles sourced from the relational (SQL) store.
 * For full song objects, use the GraphQL `genres { songs { ... } }` query instead.
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
    description:
      "Titles of songs in this genre (from the relational store). " +
      "Use the GraphQL API for full song objects.",
    example: ["Bohemian Rhapsody", "Stairway to Heaven"],
    type: [String],
  })
  songs: string[];
}
