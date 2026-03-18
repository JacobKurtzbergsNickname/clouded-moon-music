import { ExecutionContext, Logger } from "@nestjs/common";
import { of } from "rxjs";
import { LoggingInterceptor } from "./logging.interceptor";

describe("LoggingInterceptor", () => {
  let interceptor: LoggingInterceptor;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(interceptor).toBeDefined();
  });

  it("should log the request method and URL after completion", (done) => {
    const logSpy = jest.spyOn(Logger.prototype, "log");
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ method: "GET", url: "/songs" }),
      }),
    } as ExecutionContext;

    const mockCallHandler = {
      handle: () => of({ data: "result" }),
    };

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      complete: () => {
        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining("GET /songs"),
        );
        done();
      },
    });
  });
});
