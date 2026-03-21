import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreatePlaylistDTO {
  @ApiProperty({
    description: "The name of the playlist",
    example: "My Favorites",
  })
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @ApiProperty({
    description: "An optional description for the playlist",
    example: "Songs I love",
    required: false,
  })
  @IsString()
  @IsOptional()
  readonly description?: string;

  @ApiProperty({
    description: "List of song IDs to include in the playlist",
    example: ["64a1f2e3b4c5d6e7f8a9b0c1"],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  readonly songs?: string[];
}
