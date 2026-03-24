import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Song } from "../../songs/models/song.entity";

@Entity("artists")
export class Artist {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @ManyToMany(() => Song, (song) => song.artists)
  songs!: Song[];
}
