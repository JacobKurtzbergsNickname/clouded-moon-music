import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type SongDocument = HydratedDocument<Song>;

@Schema({ timestamps: true })
export class Song {
  @Prop({ required: true })
  title: string;

  @Prop({ type: [String], required: true })
  artists: string[];

  @Prop({ required: true })
  album: string;

  @Prop({ required: true })
  year: number;

  @Prop({ type: [String], required: true })
  genres: string[];

  @Prop({ required: true })
  duration: Date;

  @Prop({ required: true })
  releaseDate: Date;
}

export const SongSchema = SchemaFactory.createForClass(Song);
