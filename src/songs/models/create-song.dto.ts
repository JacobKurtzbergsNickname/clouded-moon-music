import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
} from "class-validator";

export default class CreateSongDTO {
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @IsString({ each: true })
  @IsNotEmpty()
  @IsArray()
  readonly artists: Array<string>;

  @IsString()
  @IsNotEmpty()
  readonly album: string;

  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  @IsOptional()
  readonly year: number;

  @IsDateString()
  @IsNotEmpty()
  readonly releaseDate: Date;

  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  readonly genres: Array<string>;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  readonly duration: number; // duration in seconds
}
