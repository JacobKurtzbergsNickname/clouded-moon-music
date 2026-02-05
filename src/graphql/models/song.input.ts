import { Field, GraphQLISODateTime, InputType, Int } from "@nestjs/graphql";

@InputType()
export class CreateSongInput {
  @Field()
  title: string;

  @Field(() => [String])
  artists: string[];

  @Field()
  album: string;

  @Field(() => Int, { nullable: true })
  year?: number;

  @Field(() => GraphQLISODateTime)
  releaseDate: Date;

  @Field(() => [String], { nullable: true })
  genres?: string[];

  @Field(() => Int)
  duration: number;
}

@InputType()
export class UpdateSongInput {
  @Field({ nullable: true })
  title?: string;

  @Field(() => [String], { nullable: true })
  artists?: string[];

  @Field({ nullable: true })
  album?: string;

  @Field(() => Int, { nullable: true })
  year?: number;

  @Field(() => GraphQLISODateTime, { nullable: true })
  releaseDate?: Date;

  @Field(() => [String], { nullable: true })
  genres?: string[];

  @Field(() => Int, { nullable: true })
  duration?: number;
}
