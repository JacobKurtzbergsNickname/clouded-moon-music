import { Field, ID, ObjectType } from "@nestjs/graphql";
import { SongType } from "./song.type";

@ObjectType("Playlist")
export class PlaylistType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  // Resolved via @ResolveField in resolver
  @Field(() => [SongType])
  songs?: SongType[];
}
