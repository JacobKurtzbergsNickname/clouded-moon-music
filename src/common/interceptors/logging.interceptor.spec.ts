import { ExecutionContext } from "@nestjs/common";
import { lastValueFrom, of } from "rxjs";
import { LoggingInterceptor } from "./logging.interceptor";
import { CMLogger } from "../logger";

describe("LoggingInterceptor", () => {
  let interceptor: LoggingInterceptor;
  let mockLogger: { info: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockLogger = { info: vi.fn() };
    interceptor = new LoggingInterceptor(mockLogger as unknown as CMLogger);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(interceptor).toBeDefined();
  });

  it("should log the request method and URL after completion", async () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ method: "GET", url: "/songs" }),
      }),
    } as ExecutionContext;

    const mockCallHandler = {
      handle: () => of({ data: "result" }),
    };

    await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler));

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining("GET /songs"),
    );
  });
});
