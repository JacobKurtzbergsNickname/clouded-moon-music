import { plainToInstance } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from "class-validator";

enum Environment {
  Development = "development",
  Production = "production",
  Test = "test",
}

class EnvironmentVariables {
  @IsOptional()
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3456;

  // MongoDB
  @IsOptional()
  @IsString()
  MONGODB_URI?: string;

  @IsOptional()
  @IsString()
  MONGO_HOST: string = "localhost";

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  MONGO_PORT: number = 27019;

  @IsOptional()
  @IsString()
  MONGO_USER: string = "admin";

  @IsOptional()
  @IsString()
  MONGO_PASSWORD: string = "password";

  @IsOptional()
  @IsString()
  MONGO_DATABASE: string = "clouded_moon_music";

  @IsOptional()
  @IsString()
  MONGO_AUTH_SOURCE: string = "admin";

  // PostgreSQL
  @IsOptional()
  @IsString()
  POSTGRES_HOST: string = "localhost";

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  POSTGRES_PORT: number = 5433;

  @IsOptional()
  @IsString()
  POSTGRES_USER: string = "postgres";

  @IsOptional()
  @IsString()
  POSTGRES_PASSWORD: string = "password";

  @IsOptional()
  @IsString()
  POSTGRES_DB: string = "clouded_moon_music";

  // Redis
  @IsOptional()
  @IsString()
  REDIS_HOST: string = "localhost";

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  REDIS_PORT: number = 6380;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  REDIS_DB?: number;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
