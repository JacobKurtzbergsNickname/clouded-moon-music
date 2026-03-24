import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

@InputType()
export class CreateGenreInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;
}

@InputType()
export class UpdateGenreInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;
}
