import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Song } from "../../songs/models/song.entity";

@Entity("genres")
export class Genre {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @ManyToMany(() => Song, (song) => song.genres)
  songs: Song[];
}
