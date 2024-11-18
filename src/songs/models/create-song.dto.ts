import {
  IsArray,
  IsDateString,
  IsMilitaryTime,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { ISong } from "./song.interface";

export class CreateSongDTO implements Omit<ISong, "id"> {
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

  @IsString()
  @IsMilitaryTime()
  @IsNotEmpty()
  readonly duration: Date;
}
