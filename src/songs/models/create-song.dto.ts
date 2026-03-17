import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  MaxLength,
  Min,
  Max,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export default class CreateSongDTO {
  @ApiProperty({
    description: "The title of the song",
    example: "Bohemian Rhapsody",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly title: string;

  @ApiProperty({
    description: "List of artists for the song",
    example: ["Queen"],
    type: [String],
  })
  @IsString({ each: true })
  @IsNotEmpty()
  @IsArray()
  readonly artists: Array<string>;

  @ApiProperty({
    description: "The album name",
    example: "A Night at the Opera",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly album: string;

  @ApiProperty({
    description: "The year the song was released",
    example: 1975,
    minimum: 1900,
    required: false,
  })
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  @IsOptional()
  readonly year: number;

  @ApiProperty({
    description: "The release date of the song",
    example: "1975-10-31T00:00:00.000Z",
  })
  @IsDateString()
  @IsNotEmpty()
  readonly releaseDate: Date;

  @ApiProperty({
    description: "List of genres for the song",
    example: ["Rock", "Progressive Rock"],
    type: [String],
    required: false,
  })
  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  readonly genres: Array<string>;

  @ApiProperty({
    description: "Duration of the song in seconds",
    example: 354,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @Max(86400)
  @IsNotEmpty()
  readonly duration: number; // duration in seconds
}
