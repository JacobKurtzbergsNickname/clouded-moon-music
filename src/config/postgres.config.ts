import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export class PostgresConfig {
  private readonly host: string;
  private readonly port: number;
  private readonly username: string;
  private readonly password: string;
  private readonly database: string;

  constructor(env: NodeJS.ProcessEnv) {
    this.host = env.POSTGRES_HOST ?? "localhost";
    this.port = parseInt(env.POSTGRES_PORT ?? "5432", 10);
    this.username = env.POSTGRES_USER ?? "admin";
    this.password = env.POSTGRES_PASSWORD ?? "PreahChanTravPopookKrap2026";
    this.database = env.POSTGRES_DB ?? "clouded_moon_music";
  }

  getConfig(entitiesPath: string): TypeOrmModuleOptions {
    return {
      type: "postgres",
      host: this.host,
      port: this.port,
      username: this.username,
      password: this.password,
      database: this.database,
      entities: [entitiesPath + "/**/*.entity{.ts,.js}"],
      synchronize: process.env.NODE_ENV !== "production",
      logging: process.env.NODE_ENV !== "production",
    };
  }
}

export const getPostgresConfig = (
  entitiesPath: string,
): TypeOrmModuleOptions => {
  const config = new PostgresConfig(process.env);
  return config.getConfig(entitiesPath);
};
