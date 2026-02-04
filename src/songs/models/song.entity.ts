import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { Artist } from "./artist.entity";
import { Genre } from "./genre.entity";
import { SongDTO } from "./song.dto";

@Entity("songs")
export class Song {
  @PrimaryGeneratedColumn()
  id: number;

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

  /**
   * Converts the Song entity to a SongDTO
   * Note: Requires artists and genres relations to be loaded (they are eager-loaded by default)
   */
  toDTO(): SongDTO {
    return {
      id: this.id,
      title: this.title,
      artists: this.artists.map((artist) => artist.name),
      album: this.album,
      year: this.year,
      genres: this.genres.map((genre) => genre.name),
      duration: this.duration,
      releaseDate: this.releaseDate,
    };
  }
}
