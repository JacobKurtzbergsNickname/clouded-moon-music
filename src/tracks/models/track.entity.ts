import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

export type AudioFormat = "flac" | "wav";

@Entity("tracks")
export class Track {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column()
  artist!: string;

  @Column({ nullable: true })
  album!: string;

  @Column()
  duration!: number; // seconds

  @Column({ nullable: true })
  bitrate!: number; // kbps

  @Column({ name: "sample_rate", nullable: true })
  sampleRate!: number; // Hz

  @Column({ type: "varchar", length: 10 })
  format!: AudioFormat;

  @Column({ name: "storage_key" })
  storageKey!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
