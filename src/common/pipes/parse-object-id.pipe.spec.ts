import { BadRequestException } from "@nestjs/common";
import { ParseObjectIdPipe } from "./parse-object-id.pipe";

describe("ParseObjectIdPipe", () => {
  let pipe: ParseObjectIdPipe;

  beforeEach(() => {
    pipe = new ParseObjectIdPipe();
  });

  it("should be defined", () => {
    expect(pipe).toBeDefined();
  });

  it("should return the value for a valid ObjectId", () => {
    const validId = "507f1f77bcf86cd799439011";
    expect(pipe.transform(validId)).toBe(validId);
  });

  it("should throw BadRequestException for an invalid ObjectId", () => {
    expect(() => pipe.transform("not-an-objectid")).toThrow(
      BadRequestException,
    );
  });

  it("should throw BadRequestException for an empty string", () => {
    expect(() => pipe.transform("")).toThrow(BadRequestException);
  });

  it("should throw BadRequestException for a numeric string", () => {
    expect(() => pipe.transform("12345")).toThrow(BadRequestException);
  });
});
