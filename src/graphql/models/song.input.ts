import { Field, GraphQLISODateTime, InputType, Int } from "@nestjs/graphql";
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";

/**
 * Minimum valid year for songs
 */
const MIN_VALID_YEAR = 1900;

/**
 * Custom validator to check if year is not in the future
 */
@ValidatorConstraint({ name: "isNotFutureYear", async: false })
class IsNotFutureYearConstraint implements ValidatorConstraintInterface {
  validate(year: number): boolean {
    const currentYear = new Date().getFullYear();
    return year <= currentYear;
  }

  defaultMessage(): string {
    return "Year cannot be in the future";
  }
}

function IsNotFutureYear(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotFutureYearConstraint,
    });
  };
}

@InputType()
export class CreateSongInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  title: string;

  @Field(() => [String])
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  artists: string[];

  @Field()
  @IsNotEmpty()
  @IsString()
  album: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(MIN_VALID_YEAR)
  @IsNotFutureYear()
  year?: number;

  @Field(() => GraphQLISODateTime)
  @IsNotEmpty()
  @IsDateString()
  releaseDate: Date;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @Field(() => Int)
  @IsInt()
  @Min(1)
  duration: number;
}

@InputType()
export class UpdateSongInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  artists?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  album?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(MIN_VALID_YEAR)
  @IsNotFutureYear()
  year?: number;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  @IsDateString()
  releaseDate?: Date;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;
}
