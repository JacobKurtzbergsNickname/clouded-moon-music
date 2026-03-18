import { HttpException, HttpStatus, Logger } from "@nestjs/common";
import { HttpExceptionFilter } from "./http-exception.filter";

describe("HttpExceptionFilter", () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(filter).toBeDefined();
  });

  it("should return a structured error response", () => {
    const exception = new HttpException("Not found", HttpStatus.NOT_FOUND);
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockGetResponse = jest.fn().mockReturnValue({
      status: mockStatus,
    });
    const mockGetRequest = jest.fn().mockReturnValue({
      url: "/test",
      method: "GET",
    });
    const mockSwitchToHttp = jest.fn().mockReturnValue({
      getResponse: mockGetResponse,
      getRequest: mockGetRequest,
    });
    const mockHost = {
      switchToHttp: mockSwitchToHttp,
    } as never;

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        path: "/test",
        message: "Not found",
      }),
    );
  });

  it("should extract message array from validation errors", () => {
    const exception = new HttpException(
      { message: ["field is required", "field must be a string"] },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
    const mockGetRequest = jest.fn().mockReturnValue({
      url: "/songs",
      method: "POST",
    });
    const mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: mockGetResponse,
        getRequest: mockGetRequest,
      }),
    } as never;

    filter.catch(exception, mockHost);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: ["field is required", "field must be a string"],
      }),
    );
  });
});
