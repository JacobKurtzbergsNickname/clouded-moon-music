import { Field, GraphQLISODateTime, InputType, Int } from "@nestjs/graphql";
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

@InputType()
export class CreateSongInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  title: string;

  @Field(() => [String])
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  artists: string[];

  @Field()
  @IsNotEmpty()
  @IsString()
  album: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  year?: number;

  @Field(() => GraphQLISODateTime)
  @IsNotEmpty()
  @IsDateString()
  releaseDate: Date;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @Field(() => Int)
  @IsInt()
  @Min(1)
  duration: number;
}

@InputType()
export class UpdateSongInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  artists?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  album?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  year?: number;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  @IsDateString()
  releaseDate?: Date;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;
}
