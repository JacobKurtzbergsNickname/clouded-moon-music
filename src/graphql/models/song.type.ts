import { Field, GraphQLISODateTime, ID, ObjectType } from "@nestjs/graphql";
import { ArtistType } from "./artist.type";
import { GenreType } from "./genre.type";

@ObjectType("Song")
export class SongType {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  // Resolved via @ResolveField in resolver, not from DTO
  @Field(() => [ArtistType])
  artists?: ArtistType[];

  @Field()
  album: string;

  @Field({ nullable: true })
  year?: number;

  // Resolved via @ResolveField in resolver, not from DTO
  @Field(() => [GenreType], { nullable: true })
  genres?: GenreType[];

  @Field()
  duration: number;

  @Field(() => GraphQLISODateTime)
  releaseDate: Date;
}
