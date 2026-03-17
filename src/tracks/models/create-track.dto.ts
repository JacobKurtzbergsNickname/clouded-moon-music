import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { AudioFormat } from "./track.entity";

export class CreateTrackDTO {
  @ApiProperty({ example: "Morning Wind" })
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @ApiProperty({ example: "Example Artist" })
  @IsString()
  @IsNotEmpty()
  readonly artist: string;

  @ApiProperty({ example: "Sunrise Sessions", required: false })
  @IsString()
  @IsOptional()
  readonly album?: string;

  @ApiProperty({ example: 215, description: "Duration in seconds" })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  readonly duration: number;

  @ApiProperty({ example: 1411, description: "Bitrate in kbps", required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly bitrate?: number;

  @ApiProperty({ example: 44100, description: "Sample rate in Hz", required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly sampleRate?: number;

  @ApiProperty({ enum: ["flac", "wav"], example: "flac" })
  @IsEnum(["flac", "wav"])
  @IsNotEmpty()
  readonly format: AudioFormat;

  @ApiProperty({ example: "tracks/trk_1821/master.flac" })
  @IsString()
  @IsNotEmpty()
  readonly storageKey: string;
}
