import { Test, TestingModule } from "@nestjs/testing";
import { CMLogger } from "./logger.service";
import { Logger } from "winston";
import { ILogEntry } from "./interfaces";

jest.mock("./winston.config", () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  return {
    __esModule: true,
    default: mockLogger,
  };
});

import winstonLogger from "./winston.config";

describe("CMLogger", () => {
  let service: CMLogger;
  let logger: jest.Mocked<Logger>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CMLogger],
    }).compile();

    service = module.get<CMLogger>(CMLogger);
    logger = winstonLogger as jest.Mocked<Logger>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should log info messages", () => {
    const mockLogEntry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Test log message",
    };
    service.info("info", mockLogEntry);
    expect(logger.info).toHaveBeenCalledWith("info", mockLogEntry);
  });

  it("should log error messages", () => {
    const message = "Test error message";
    const trace = "Error trace";
    service.error(message, trace);
    expect(logger.error).toHaveBeenCalledWith(
      `${message} - Trace: ${trace}`,
    );
  });

  it("should log warn messages", () => {
    const message = "Test warn message";
    service.warn(message);
    expect(logger.warn).toHaveBeenCalledWith(message);
  });

  it("should log debug messages", () => {
    const message = "Test debug message";
    service.debug(message);
    expect(logger.debug).toHaveBeenCalledWith(message);
  });

  it("should log verbose messages", () => {
    const message = "Test verbose message";
    service.verbose(message);
    expect(logger.verbose).toHaveBeenCalledWith(message);
  });

  it("should log via the standard log method", () => {
    service.log("Standard log message");
    expect(logger.info).toHaveBeenCalledWith("Standard log message");
  });
});
