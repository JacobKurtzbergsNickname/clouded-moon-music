import "reflect-metadata";
import * as dotenv from "dotenv";
import { DataSource } from "typeorm";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST ?? "localhost",
  port: parseInt(process.env.POSTGRES_PORT ?? "5433", 10),
  username: process.env.POSTGRES_USER ?? "admin",
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB ?? "clouded_moon_music",
  entities: [__dirname + "/**/*.entity{.ts,.js}"],
  migrations: [__dirname + "/migrations/**/*{.ts,.js}"],
  migrationsTableName: "typeorm_migrations",
  synchronize: false,
  logging: true,
});
