import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

@InputType()
export class CreateArtistInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;
}

@InputType()
export class UpdateArtistInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;
}
