import { ExecutionContext, Logger } from "@nestjs/common";
import { lastValueFrom, of } from "rxjs";
import { LoggingInterceptor } from "./logging.interceptor";

describe("LoggingInterceptor", () => {
  let interceptor: LoggingInterceptor;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    vi.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(interceptor).toBeDefined();
  });

  it("should log the request method and URL after completion", async () => {
    const logSpy = vi.spyOn(Logger.prototype, "log");
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ method: "GET", url: "/songs" }),
      }),
    } as ExecutionContext;

    const mockCallHandler = {
      handle: () => of({ data: "result" }),
    };

    await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler));

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("GET /songs"));
  });
});
