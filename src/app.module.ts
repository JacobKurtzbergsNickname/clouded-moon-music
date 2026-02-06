import { Logger, MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
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
import { SongsController } from "./songs/songs.controller";
import { getMongoDbUri } from "./config/mongodb.config";
import { getPostgresConfig } from "./config/postgres.config";
import { GraphqlModule } from "./graphql/graphql.module";
import { ArtistsModule } from "./artists/artists.module";
import { GenresModule } from "./genres/genres.module";
import { RedisModule } from "./redis/redis.module";

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

@Module({
  imports: [
    MongooseModule.forRoot(getMongoDbUri(), {
      retryAttempts: 3,
      retryDelay: 1000,
      connectionFactory: mongoConnectionFactory,
    }),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "src/schema.gql"),
      sortSchema: true,
      validationRules: [
        // Limit query depth to prevent excessively nested queries
        depthLimit(5),
        // Add complexity analysis to prevent expensive queries
        createComplexityRule({
          maximumComplexity: 1000,
          variables: {},
          estimators: [
            // Default complexity of 1 per field
            () => 1,
          ],
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

    TypeOrmModule.forRoot(getPostgresConfig(__dirname)),

    SongsModule,
    GraphqlModule,
    ArtistsModule,
    GenresModule,
    RedisModule,

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
    consumer.apply(LoggerMiddleware).forRoutes(SongsController);
  }
}
