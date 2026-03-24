import { Field, ID, Int, ObjectType } from "@nestjs/graphql";
import { SongType } from "./song.type";

@ObjectType("Album")
export class AlbumType {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field(() => Int, { nullable: true })
  releaseYear?: number;

  // Resolved via @ResolveField in resolver, not from DTO
  @Field(() => [SongType], { nullable: true })
  songs?: SongType[];
}
