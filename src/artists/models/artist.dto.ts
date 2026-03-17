import { ApiProperty } from "@nestjs/swagger";

/**
 * Data Transfer Object for Artist.
 * Flattens the songs relation to avoid circular references during JSON serialization.
 * The `songs` array contains song titles sourced from the relational (SQL) store.
 * For full song objects, use the GraphQL `artists { songs { ... } }` query instead.
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
    description:
      "Titles of songs associated with this artist (from the relational store). " +
      "Use the GraphQL API for full song objects.",
    example: ["Bohemian Rhapsody", "We Will Rock You"],
    type: [String],
  })
  songs: string[];
}
