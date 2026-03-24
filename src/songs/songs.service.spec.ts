import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { CMLogger } from "../common/logger";
import { RedisService } from "../redis/redis.service";
import { SongsService } from "./songs.service";
import { SONGS_REPOSITORY } from "./repositories/songs.repository";
import { SongDTO } from "./models/song.dto";
import CreateSongDTO from "./models/create-song.dto";
import { ArtistsService } from "../artists/artists.service";
import { GenresService } from "../genres/genres.service";

describe("SongsService", () => {
  let service: SongsService;
  let mockRepository: jest.Mocked<{
    findAll: () => Promise<SongDTO[]>;
    findOne: (id: string) => Promise<SongDTO | null>;
    findByIds: (ids: string[]) => Promise<(SongDTO | null)[]>;
    create: (dto: CreateSongDTO) => Promise<SongDTO>;
    update: (
      id: string,
      song: Partial<CreateSongDTO>,
    ) => Promise<SongDTO | null>;
    replace: (id: string, song: CreateSongDTO) => Promise<SongDTO | null>;
    remove: (id: string) => Promise<string | null>;
    findByArtistIds: (ids: string[]) => Promise<SongDTO[]>;
    findByGenreIds: (ids: string[]) => Promise<SongDTO[]>;
  }>;
  let mockArtistsService: jest.Mocked<Pick<ArtistsService, "findByIds">>;
  let mockGenresService: jest.Mocked<Pick<GenresService, "findByIds">>;
  let mockRedisService: jest.Mocked<{
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string, ttl: number) => Promise<string>;
    del: (...keys: string[]) => Promise<number>;
    deletePattern: (pattern: string) => Promise<number>;
  }>;
  let mockLogger: jest.Mocked<{
    info: (msg: string) => void;
    error: (msg: string) => void;
    warn: (msg: string) => void;
    debug: (msg: string) => void;
    verbose: (msg: string) => void;
  }>;

  beforeEach(async () => {
    mockRepository = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByIds: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      replace: jest.fn(),
      remove: jest.fn(),
      findByArtistIds: jest.fn(),
      findByGenreIds: jest.fn(),
    };

    mockArtistsService = {
      findByIds: jest.fn().mockResolvedValue([]),
    };

    mockGenresService = {
      findByIds: jest.fn().mockResolvedValue([]),
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
          provide: ArtistsService,
          useValue: mockArtistsService,
        },
        {
          provide: GenresService,
          useValue: mockGenresService,
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
      expect(mockLogger.info).toHaveBeenCalledWith("Cache hit: song:123");
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
        expect.stringContaining("Cache miss for song:123, falling back to DB"),
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
      artists: ["artist-1"],
      album: "New Album",
      year: 2024,
      genres: ["genre-1"],
      duration: 240,
      releaseDate: new Date("2024-02-01"),
    };

    const mockCreatedSong: SongDTO = {
      id: "456",
      ...createDto,
    };

    it("should create song and invalidate list caches", async () => {
      mockArtistsService.findByIds.mockResolvedValue([
        { id: "artist-1", name: "Artist", songs: [] },
      ]);
      mockGenresService.findByIds.mockResolvedValue([
        { id: "genre-1", name: "Jazz", songs: [] },
      ]);
      mockRepository.create.mockResolvedValue(mockCreatedSong);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCreatedSong);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRedisService.del).toHaveBeenCalled();
      expect(mockRedisService.deletePattern).toHaveBeenCalledWith(
        "songs:list:filtered:*",
      );
    });

    it("should throw BadRequestException when artist IDs do not exist", async () => {
      mockArtistsService.findByIds.mockResolvedValue([null]);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it("should throw BadRequestException when genre IDs do not exist", async () => {
      mockArtistsService.findByIds.mockResolvedValue([
        { id: "artist-1", name: "Artist", songs: [] },
      ]);
      mockGenresService.findByIds.mockResolvedValue([null]);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it("should handle cache invalidation failure gracefully", async () => {
      mockArtistsService.findByIds.mockResolvedValue([
        { id: "artist-1", name: "Artist", songs: [] },
      ]);
      mockGenresService.findByIds.mockResolvedValue([
        { id: "genre-1", name: "Jazz", songs: [] },
      ]);
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
      artists: ["artist-1"],
      album: "Test Album",
      year: 2024,
      genres: ["genre-1"],
      duration: 180,
      releaseDate: new Date("2024-01-01"),
    };

    it("should update song and invalidate caches", async () => {
      mockRepository.update.mockResolvedValue(mockUpdatedSong);

      const result = await service.update("123", updateDto);

      expect(result).toEqual(mockUpdatedSong);
      expect(mockRedisService.del).toHaveBeenCalled();
      expect(mockRedisService.deletePattern).toHaveBeenCalledWith(
        "songs:list:filtered:*",
      );
    });

    it("should validate artist IDs when provided in update", async () => {
      mockArtistsService.findByIds.mockResolvedValue([null]);

      await expect(
        service.update("123", { artists: ["missing-artist"] }),
      ).rejects.toThrow(BadRequestException);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it("should not invalidate cache if song not found", async () => {
      mockRepository.update.mockResolvedValue(null);

      const result = await service.update("999", updateDto);

      expect(result).toBeNull();
      expect(mockRedisService.del).not.toHaveBeenCalled();
    });
  });

  describe("replace", () => {
    const replaceDto: CreateSongDTO = {
      title: "Replaced Song",
      artists: ["artist-1"],
      album: "New Album",
      year: 2025,
      genres: ["genre-1"],
      duration: 200,
      releaseDate: new Date("2025-01-01"),
    };

    const mockReplacedSong: SongDTO = {
      id: "123",
      ...replaceDto,
    };

    it("should replace song and invalidate caches", async () => {
      mockArtistsService.findByIds.mockResolvedValue([
        { id: "artist-1", name: "New Artist", songs: [] },
      ]);
      mockGenresService.findByIds.mockResolvedValue([
        { id: "genre-1", name: "Jazz", songs: [] },
      ]);
      mockRepository.replace.mockResolvedValue(mockReplacedSong);

      const result = await service.replace("123", replaceDto);

      expect(result).toEqual(mockReplacedSong);
      expect(mockRedisService.del).toHaveBeenCalled();
      expect(mockRedisService.deletePattern).toHaveBeenCalledWith(
        "songs:list:filtered:*",
      );
    });

    it("should not invalidate cache if song not found", async () => {
      mockArtistsService.findByIds.mockResolvedValue([
        { id: "artist-1", name: "New Artist", songs: [] },
      ]);
      mockGenresService.findByIds.mockResolvedValue([
        { id: "genre-1", name: "Jazz", songs: [] },
      ]);
      mockRepository.replace.mockResolvedValue(null);

      const result = await service.replace("999", replaceDto);

      expect(result).toBeNull();
      expect(mockRedisService.del).not.toHaveBeenCalled();
    });

    it("should handle cache invalidation failure gracefully", async () => {
      mockArtistsService.findByIds.mockResolvedValue([
        { id: "artist-1", name: "New Artist", songs: [] },
      ]);
      mockGenresService.findByIds.mockResolvedValue([
        { id: "genre-1", name: "Jazz", songs: [] },
      ]);
      mockRepository.replace.mockResolvedValue(mockReplacedSong);
      mockRedisService.del.mockRejectedValue(new Error("Redis failed"));

      const result = await service.replace("123", replaceDto);

      expect(result).toEqual(mockReplacedSong);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Cache invalidation failed"),
      );
    });
  });

  describe("remove", () => {
    it("should remove song and invalidate caches", async () => {
      mockRepository.remove.mockResolvedValue("123");

      const result = await service.remove("123");

      expect(result).toBe("123");
      expect(mockRedisService.del).toHaveBeenCalledWith(
        "songs:list:all",
        "artists:list:all",
        "genres:list:all",
        "song:123",
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
