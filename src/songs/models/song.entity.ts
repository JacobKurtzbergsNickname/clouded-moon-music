import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { Artist } from "./artist.entity";
import { Genre } from "./genre.entity";

@Entity("songs")
export class Song {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  title: string;

  @ManyToMany(() => Artist, (artist) => artist.songs, { eager: true })
  @JoinTable({
    name: "song_artists",
    joinColumn: { name: "song_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "artist_id", referencedColumnName: "id" },
  })
  artists: Artist[];

  @Column()
  album: string;

  @Column({ nullable: true })
  year: number;

  @ManyToMany(() => Genre, (genre) => genre.songs, { eager: true })
  @JoinTable({
    name: "song_genres",
    joinColumn: { name: "song_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "genre_id", referencedColumnName: "id" },
  })
  genres: Genre[];

  @Column()
  duration: number;

  @Column({ type: "timestamp" })
  releaseDate: Date;
}
