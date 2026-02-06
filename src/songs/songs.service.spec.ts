import { Test, TestingModule } from "@nestjs/testing";
import { CMLogger } from "../common/logger";
import { RedisService } from "../redis/redis.service";
import { SongsService } from "./songs.service";
import { SONGS_REPOSITORY } from "./repositories/songs.repository";
import { SongDTO } from "./models/song.dto";
import CreateSongDTO from "./models/create-song.dto";

describe("SongsService", () => {
  let service: SongsService;
  let mockRepository: any;
  let mockRedisService: any;
  let mockLogger: any;

  beforeEach(async () => {
    mockRepository = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      replace: jest.fn(),
      remove: jest.fn(),
    };

    mockRedisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue("OK"),
      del: jest.fn().mockResolvedValue(1),
      deletePattern: jest.fn().mockResolvedValue(1),
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
        SongsService,
        {
          provide: SONGS_REPOSITORY,
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

    service = module.get<SongsService>(SongsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findOne", () => {
    const mockSong: SongDTO = {
      id: "123",
      title: "Test Song",
      artists: ["Artist 1"],
      album: "Test Album",
      year: 2024,
      genres: ["Rock"],
      duration: 180,
      releaseDate: new Date("2024-01-01"),
    };

    it("should return cached song on cache hit", async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(mockSong));

      const result = await service.findOne("123");

      // When deserialized from JSON, Dates become strings
      expect(result).toEqual({
        ...mockSong,
        releaseDate: mockSong.releaseDate.toISOString(),
      });
      expect(mockRedisService.get).toHaveBeenCalledWith("song:123");
      expect(mockRepository.findOne).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Cache hit",
        expect.objectContaining({
          message: "Cache hit for song 123",
        }),
      );
    });

    it("should fetch from repository on cache miss and populate cache", async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mockSong);

      const result = await service.findOne("123");

      expect(result).toEqual(mockSong);
      expect(mockRedisService.get).toHaveBeenCalledWith("song:123");
      expect(mockRepository.findOne).toHaveBeenCalledWith("123");
      expect(mockRedisService.set).toHaveBeenCalledWith(
        "song:123",
        JSON.stringify(mockSong),
        300,
      );
    });

    it("should handle Redis read failure gracefully", async () => {
      mockRedisService.get.mockRejectedValue(
        new Error("Redis connection failed"),
      );
      mockRepository.findOne.mockResolvedValue(mockSong);

      const result = await service.findOne("123");

      expect(result).toEqual(mockSong);
      expect(mockRepository.findOne).toHaveBeenCalledWith("123");
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Cache read failed, falling back to DB"),
      );
    });

    it("should handle Redis write failure gracefully", async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mockSong);
      mockRedisService.set.mockRejectedValue(new Error("Redis write failed"));

      const result = await service.findOne("123");

      expect(result).toEqual(mockSong);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Cache write failed"),
      );
    });
  });

  describe("findAll", () => {
    const mockSongs: SongDTO[] = [
      {
        id: "1",
        title: "Song 1",
        artists: ["Artist 1"],
        album: "Album 1",
        year: 2024,
        genres: ["Rock"],
        duration: 180,
        releaseDate: new Date("2024-01-01"),
      },
      {
        id: "2",
        title: "Song 2",
        artists: ["Artist 2"],
        album: "Album 2",
        year: 2024,
        genres: ["Pop"],
        duration: 200,
        releaseDate: new Date("2024-01-02"),
      },
    ];

    it("should return cached songs on cache hit", async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(mockSongs));

      const result = await service.findAll();

      // When deserialized from JSON, Dates become strings
      expect(result).toEqual(
        mockSongs.map((song) => ({
          ...song,
          releaseDate: song.releaseDate.toISOString(),
        })),
      );
      expect(mockRedisService.get).toHaveBeenCalledWith("songs:list:all");
      expect(mockRepository.findAll).not.toHaveBeenCalled();
    });

    it("should fetch from repository on cache miss and populate cache", async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findAll.mockResolvedValue(mockSongs);

      const result = await service.findAll();

      expect(result).toEqual(mockSongs);
      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(mockRedisService.set).toHaveBeenCalledWith(
        "songs:list:all",
        JSON.stringify(mockSongs),
        60,
      );
    });

    it("should handle Redis failure gracefully", async () => {
      mockRedisService.get.mockRejectedValue(new Error("Redis failed"));
      mockRepository.findAll.mockResolvedValue(mockSongs);

      const result = await service.findAll();

      expect(result).toEqual(mockSongs);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });
  });

  describe("create", () => {
    const createDto: CreateSongDTO = {
      title: "New Song",
      artists: ["New Artist"],
      album: "New Album",
      year: 2024,
      genres: ["Jazz"],
      duration: 240,
      releaseDate: new Date("2024-02-01"),
    };

    const mockCreatedSong: SongDTO = {
      id: "456",
      ...createDto,
    };

    it("should create song and invalidate list caches", async () => {
      mockRepository.create.mockResolvedValue(mockCreatedSong);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCreatedSong);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRedisService.del).toHaveBeenCalledWith("songs:list:all");
      expect(mockRedisService.deletePattern).toHaveBeenCalledWith(
        "songs:list:filtered:*",
      );
    });

    it("should handle cache invalidation failure gracefully", async () => {
      mockRepository.create.mockResolvedValue(mockCreatedSong);
      mockRedisService.del.mockRejectedValue(new Error("Redis del failed"));

      const result = await service.create(createDto);

      expect(result).toEqual(mockCreatedSong);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Cache invalidation failed"),
      );
    });
  });

  describe("update", () => {
    const updateDto: Partial<CreateSongDTO> = {
      title: "Updated Song",
    };

    const mockUpdatedSong: SongDTO = {
      id: "123",
      title: "Updated Song",
      artists: ["Artist 1"],
      album: "Test Album",
      year: 2024,
      genres: ["Rock"],
      duration: 180,
      releaseDate: new Date("2024-01-01"),
    };

    it("should update song and invalidate caches", async () => {
      mockRepository.update.mockResolvedValue(mockUpdatedSong);

      const result = await service.update("123", updateDto);

      expect(result).toEqual(mockUpdatedSong);
      expect(mockRedisService.del).toHaveBeenCalledWith(
        "song:123",
        "songs:list:all",
      );
      expect(mockRedisService.deletePattern).toHaveBeenCalledWith(
        "songs:list:filtered:*",
      );
    });

    it("should not invalidate cache if song not found", async () => {
      mockRepository.update.mockResolvedValue(null);

      const result = await service.update("999", updateDto);

      expect(result).toBeNull();
      expect(mockRedisService.del).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("should remove song and invalidate caches", async () => {
      mockRepository.remove.mockResolvedValue("123");

      const result = await service.remove("123");

      expect(result).toBe("123");
      expect(mockRedisService.del).toHaveBeenCalledWith(
        "song:123",
        "songs:list:all",
      );
      expect(mockRedisService.deletePattern).toHaveBeenCalledWith(
        "songs:list:filtered:*",
      );
    });

    it("should not invalidate cache if song not found", async () => {
      mockRepository.remove.mockResolvedValue(null);

      const result = await service.remove("999");

      expect(result).toBeNull();
      expect(mockRedisService.del).not.toHaveBeenCalled();
    });

    it("should handle cache invalidation failure gracefully", async () => {
      mockRepository.remove.mockResolvedValue("123");
      mockRedisService.del.mockRejectedValue(new Error("Redis failed"));

      const result = await service.remove("123");

      expect(result).toBe("123");
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Cache invalidation failed"),
      );
    });
  });
});
