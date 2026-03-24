import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("albums")
export class Album {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ nullable: true })
  releaseYear?: number;
}
