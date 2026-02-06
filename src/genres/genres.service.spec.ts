import { Test, TestingModule } from "@nestjs/testing";
import { CMLogger } from "../common/logger";
import { RedisService } from "../redis/redis.service";
import { GenresService } from "./genres.service";
import { GENRES_REPOSITORY } from "./repositories/genres.repository";
import { Genre } from "./models/genre.entity";

describe("GenresService", () => {
  let service: GenresService;
  let mockRepository: any;
  let mockRedisService: any;
  let mockLogger: any;

  beforeEach(async () => {
    mockRepository = {
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    mockRedisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue("OK"),
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenresService,
        {
          provide: GENRES_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: CMLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<GenresService>(GenresService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findOne", () => {
    const mockGenre: Genre = {
      id: 1,
      name: "Rock",
      songs: [],
    };

    it("should return cached genre on cache hit", async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(mockGenre));

      const result = await service.findOne("1");

      expect(result).toEqual(mockGenre);
      expect(mockRedisService.get).toHaveBeenCalledWith("genre:1");
      expect(mockRepository.findOne).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Cache hit",
        expect.objectContaining({
          message: "Cache hit for genre 1",
        }),
      );
    });

    it("should fetch from repository on cache miss and populate cache", async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mockGenre);

      const result = await service.findOne("1");

      expect(result).toEqual(mockGenre);
      expect(mockRedisService.get).toHaveBeenCalledWith("genre:1");
      expect(mockRepository.findOne).toHaveBeenCalledWith("1");
      expect(mockRedisService.set).toHaveBeenCalledWith(
        "genre:1",
        JSON.stringify(mockGenre),
        600,
      );
    });

    it("should handle Redis read failure gracefully", async () => {
      mockRedisService.get.mockRejectedValue(
        new Error("Redis connection failed"),
      );
      mockRepository.findOne.mockResolvedValue(mockGenre);

      const result = await service.findOne("1");

      expect(result).toEqual(mockGenre);
      expect(mockRepository.findOne).toHaveBeenCalledWith("1");
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Cache read failed, falling back to DB"),
      );
    });

    it("should handle Redis write failure gracefully", async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mockGenre);
      mockRedisService.set.mockRejectedValue(new Error("Redis write failed"));

      const result = await service.findOne("1");

      expect(result).toEqual(mockGenre);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Cache write failed"),
      );
    });
  });

  describe("findAll", () => {
    const mockGenres: Genre[] = [
      {
        id: 1,
        name: "Rock",
        songs: [],
      },
      {
        id: 2,
        name: "Jazz",
        songs: [],
      },
    ];

    it("should return cached genres on cache hit", async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(mockGenres));

      const result = await service.findAll();

      expect(result).toEqual(mockGenres);
      expect(mockRedisService.get).toHaveBeenCalledWith("genres:list:all");
      expect(mockRepository.findAll).not.toHaveBeenCalled();
    });

    it("should fetch from repository on cache miss and populate cache", async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findAll.mockResolvedValue(mockGenres);

      const result = await service.findAll();

      expect(result).toEqual(mockGenres);
      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(mockRedisService.set).toHaveBeenCalledWith(
        "genres:list:all",
        JSON.stringify(mockGenres),
        300,
      );
    });

    it("should handle Redis failure gracefully", async () => {
      mockRedisService.get.mockRejectedValue(new Error("Redis failed"));
      mockRepository.findAll.mockResolvedValue(mockGenres);

      const result = await service.findAll();

      expect(result).toEqual(mockGenres);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });
  });
});
