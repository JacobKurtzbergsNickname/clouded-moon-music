import { Test, TestingModule } from "@nestjs/testing";
import { CMLogger } from "../common/logger";
import { RedisService } from "../redis/redis.service";
import { ArtistsService } from "./artists.service";
import { ARTISTS_REPOSITORY } from "./repositories/artists.repository";
import { ArtistDTO } from "./models/artist.dto";

describe("ArtistsService", () => {
  let service: ArtistsService;
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
        ArtistsService,
        {
          provide: ARTISTS_REPOSITORY,
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

    service = module.get<ArtistsService>(ArtistsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findOne", () => {
    const mockArtist: ArtistDTO = {
      id: "1",
      name: "Test Artist",
      songs: [],
    };

    it("should return cached artist on cache hit", async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(mockArtist));

      const result = await service.findOne("1");

      expect(result).toEqual(mockArtist);
      expect(mockRedisService.get).toHaveBeenCalledWith("artist:1");
      expect(mockRepository.findOne).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Cache hit",
        expect.objectContaining({
          message: "Cache hit for artist 1",
        }),
      );
    });

    it("should fetch from repository on cache miss and populate cache", async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mockArtist);

      const result = await service.findOne("1");

      expect(result).toEqual(mockArtist);
      expect(mockRedisService.get).toHaveBeenCalledWith("artist:1");
      expect(mockRepository.findOne).toHaveBeenCalledWith("1");
      expect(mockRedisService.set).toHaveBeenCalledWith(
        "artist:1",
        JSON.stringify(mockArtist),
        600,
      );
    });

    it("should handle Redis read failure gracefully", async () => {
      mockRedisService.get.mockRejectedValue(
        new Error("Redis connection failed"),
      );
      mockRepository.findOne.mockResolvedValue(mockArtist);

      const result = await service.findOne("1");

      expect(result).toEqual(mockArtist);
      expect(mockRepository.findOne).toHaveBeenCalledWith("1");
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Cache read failed, falling back to DB"),
      );
    });

    it("should handle Redis write failure gracefully", async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mockArtist);
      mockRedisService.set.mockRejectedValue(new Error("Redis write failed"));

      const result = await service.findOne("1");

      expect(result).toEqual(mockArtist);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Cache write failed"),
      );
    });
  });

  describe("findAll", () => {
    const mockArtists: ArtistDTO[] = [
      {
        id: "1",
        name: "Artist 1",
        songs: [],
      },
      {
        id: "2",
        name: "Artist 2",
        songs: [],
      },
    ];

    it("should return cached artists on cache hit", async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(mockArtists));

      const result = await service.findAll();

      expect(result).toEqual(mockArtists);
      expect(mockRedisService.get).toHaveBeenCalledWith("artists:list:all");
      expect(mockRepository.findAll).not.toHaveBeenCalled();
    });

    it("should fetch from repository on cache miss and populate cache", async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findAll.mockResolvedValue(mockArtists);

      const result = await service.findAll();

      expect(result).toEqual(mockArtists);
      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(mockRedisService.set).toHaveBeenCalledWith(
        "artists:list:all",
        JSON.stringify(mockArtists),
        300,
      );
    });

    it("should handle Redis failure gracefully", async () => {
      mockRedisService.get.mockRejectedValue(new Error("Redis failed"));
      mockRepository.findAll.mockResolvedValue(mockArtists);

      const result = await service.findAll();

      expect(result).toEqual(mockArtists);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });
  });
});
