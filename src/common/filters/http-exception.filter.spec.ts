import { HttpException, HttpStatus, Logger } from "@nestjs/common";
import { HttpExceptionFilter } from "./http-exception.filter";

describe("HttpExceptionFilter", () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    vi.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(filter).toBeDefined();
  });

  it("should return a structured error response", () => {
    const exception = new HttpException("Not found", HttpStatus.NOT_FOUND);
    const mockJson = vi.fn();
    const mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    const mockGetResponse = vi.fn().mockReturnValue({
      status: mockStatus,
    });
    const mockGetRequest = vi.fn().mockReturnValue({
      url: "/test",
      method: "GET",
    });
    const mockSwitchToHttp = vi.fn().mockReturnValue({
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
    const mockJson = vi.fn();
    const mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    const mockGetResponse = vi.fn().mockReturnValue({ status: mockStatus });
    const mockGetRequest = vi.fn().mockReturnValue({
      url: "/songs",
      method: "POST",
    });
    const mockHost = {
      switchToHttp: vi.fn().mockReturnValue({
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
