import { Field, GraphQLISODateTime, ID, ObjectType } from "@nestjs/graphql";

@ObjectType("Song")
export class SongType {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field(() => [String])
  artists: string[];

  @Field()
  album: string;

  @Field({ nullable: true })
  year?: number;

  @Field(() => [String], { nullable: true })
  genres?: string[];

  @Field()
  duration: number;

  @Field(() => GraphQLISODateTime)
  releaseDate: Date;
}
