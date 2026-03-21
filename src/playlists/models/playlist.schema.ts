import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type PlaylistDocument = HydratedDocument<Playlist>;

@Schema({ timestamps: true })
export class Playlist {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: [String], default: [] })
  songs: string[];
}

export const PlaylistSchema = SchemaFactory.createForClass(Playlist);

PlaylistSchema.virtual("id").get(function (this: any) {
  return this._id.toString();
});

PlaylistSchema.set("toJSON", {
  virtuals: true,
});

PlaylistSchema.set("toObject", {
  virtuals: true,
});
