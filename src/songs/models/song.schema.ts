import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type SongDocument = HydratedDocument<Song>;

@Schema({ timestamps: true })
export class Song {
  @Prop({ required: true })
  title!: string;

  @Prop({ type: [String], required: true, index: true })
  artists!: string[];

  @Prop({ required: true })
  album!: string;

  @Prop()
  year!: number;

  @Prop({ type: [String], index: true })
  genres!: string[];

  @Prop({ required: true })
  duration!: number;

  @Prop({ required: true })
  releaseDate!: Date;
}

export const SongSchema = SchemaFactory.createForClass(Song);

SongSchema.virtual("id").get(function (this: SongDocument) {
  return this._id.toString();
});

SongSchema.set("toJSON", {
  virtuals: true,
});

SongSchema.set("toObject", {
  virtuals: true,
});
