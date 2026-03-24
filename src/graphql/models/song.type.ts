import {
  Field,
  GraphQLISODateTime,
  ID,
  Int,
  ObjectType,
} from "@nestjs/graphql";
import { ArtistType } from "./artist.type";
import { GenreType } from "./genre.type";
import { AlbumType } from "./album.type";

@ObjectType("Song")
export class SongType {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  // Resolved via @ResolveField in resolver, not from DTO
  @Field(() => [ArtistType])
  artists?: ArtistType[];

  // Resolved via @ResolveField in resolver, not from DTO
  @Field(() => AlbumType, { nullable: true })
  album?: AlbumType;

  @Field(() => Int, { nullable: true })
  year?: number;

  // Resolved via @ResolveField in resolver, not from DTO
  @Field(() => [GenreType], { nullable: true })
  genres?: GenreType[];

  @Field(() => Int)
  duration!: number;

  @Field(() => GraphQLISODateTime)
  releaseDate!: Date;
}

/**
 * Represents the raw payload shape returned by services before relationship
 * fields (artists, genres) are resolved via @ResolveField.
 * Use this type in the GraphQL service layer and DataLoaders to avoid
 * unsound `as unknown as SongType` casts.
 */
export type SongRawGqlType = Omit<SongType, "artists" | "genres" | "album"> & {
  artists?: string[];
  genres?: string[];
  album?: string;
};
