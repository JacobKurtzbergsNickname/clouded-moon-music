import { Logger, MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { GraphQLModule } from "@nestjs/graphql";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WinstonModule } from "nest-winston";
import winston from "winston";
import { join } from "path";
import depthLimit from "graphql-depth-limit";
import { createComplexityRule } from "graphql-query-complexity";
import { GraphQLError } from "graphql";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { LoggerMiddleware } from "./common/middleware/logger.middleware";
import { LoggerModule } from "./common/logger/logger.module";
import { SongsModule } from "./songs/songs.module";
import { GraphQLModule as CloudedMoonGraphQLModule } from "./graphql/graphql.module";
import { ArtistsModule } from "./artists/artists.module";
import { AlbumsModule } from "./albums/albums.module";
import { GenresModule } from "./genres/genres.module";
import { RedisModule } from "./redis/redis.module";
import { TracksModule } from "./tracks/tracks.module";
import { HealthModule } from "./health/health.module";
import { validate } from "./config/env.validation";
import { PlaylistsModule } from "./playlists/playlists.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const mongoConnectionFactory = (connection: Connection) => {
          connection.on("connected", () => {
            winston.info("MongoDB connected successfully");
          });
          connection.on("error", (error: Error) => {
            winston.error("MongoDB connection error:", error);
          });
          connection.on("disconnected", () => {
            winston.warn("MongoDB disconnected");
          });
          return connection;
        };

        const uri =
          config.get<string>("MONGODB_URI") ??
          `mongodb://${config.get("MONGO_USER")}:${config.get("MONGO_PASSWORD")}@${config.get("MONGO_HOST")}:${config.get("MONGO_PORT")}/${config.get("MONGO_DATABASE")}?authSource=${config.get("MONGO_AUTH_SOURCE")}`;

        return {
          uri,
          retryAttempts: 3,
          retryDelay: 1000,
          connectionFactory: mongoConnectionFactory,
        };
      },
    }),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "src/schema.gql"),
      sortSchema: true,
      validationRules: [
        depthLimit(5),
        createComplexityRule({
          maximumComplexity: 1000,
          variables: {},
          estimators: [() => 1],
          onComplete: (complexity: number) => {
            Logger.debug(
              `GraphQL query complexity: ${complexity}`,
              "GraphQLComplexity",
            );
          },
          createError: (max: number, actual: number) => {
            return new GraphQLError(
              `Query is too complex: ${actual}. Maximum allowed complexity: ${max}`,
            );
          },
        }),
      ],
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get<string>("POSTGRES_HOST"),
        port: config.get<number>("POSTGRES_PORT"),
        username: config.get<string>("POSTGRES_USER"),
        password: config.get<string>("POSTGRES_PASSWORD"),
        database: config.get<string>("POSTGRES_DB"),
        entities: [__dirname + "/**/*.entity{.ts,.js}"],
        synchronize: config.get<string>("NODE_ENV") !== "production",
        logging: config.get<string>("NODE_ENV") !== "production",
      }),
    }),

    SongsModule,
    CloudedMoonGraphQLModule,
    ArtistsModule,
    AlbumsModule,
    GenresModule,
    RedisModule,
    TracksModule,
    HealthModule,
    PlaylistsModule,

    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
        }),
        new winston.transports.File({
          filename: "logs/combined.log",
        }),
      ],
    }),

    LoggerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
