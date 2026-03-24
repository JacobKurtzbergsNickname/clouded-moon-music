import { Field, ID, ObjectType } from "@nestjs/graphql";
import { SongType } from "./song.type";

@ObjectType("Artist")
export class ArtistType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  // Resolved via @ResolveField in resolver, not from entity
  @Field(() => [SongType])
  songs?: SongType[];
}
