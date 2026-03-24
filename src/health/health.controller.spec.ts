import { Test, TestingModule } from "@nestjs/testing";
import {
  HealthCheckService,
  MongooseHealthIndicator,
  TypeOrmHealthIndicator,
} from "@nestjs/terminus";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;

  const mockHealthCheckService = {
    check: vi.fn(),
  };

  const mockMongooseHealthIndicator = {
    pingCheck: vi.fn(),
  };

  const mockTypeOrmHealthIndicator = {
    pingCheck: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: mockHealthCheckService,
        },
        {
          provide: MongooseHealthIndicator,
          useValue: mockMongooseHealthIndicator,
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: mockTypeOrmHealthIndicator,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("check", () => {
    it("should call health.check with mongoose and typeorm indicators", async () => {
      const healthResult = {
        status: "ok",
        info: { mongodb: { status: "up" }, postgresql: { status: "up" } },
        error: {},
        details: { mongodb: { status: "up" }, postgresql: { status: "up" } },
      };
      mockHealthCheckService.check.mockResolvedValue(healthResult);

      const result = await controller.check();

      expect(healthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function),
        expect.any(Function),
      ]);
      expect(result).toEqual(healthResult);
    });
  });
});
