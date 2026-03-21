import { Test, TestingModule } from "@nestjs/testing";
import { CMLogger } from "../common/logger";
import { RedisService } from "../redis/redis.service";
import { StorageService } from "../storage/storage.service";
import { TracksService } from "./tracks.service";
import { TRACKS_REPOSITORY } from "./repositories/tracks.repository";
import { TrackDTO } from "./models/track.dto";
import { CreateTrackDTO } from "./models/create-track.dto";

describe("TracksService", () => {
  let service: TracksService;
  let mockRepository: jest.Mocked<{
    findAll: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    remove: jest.Mock;
  }>;
  let mockRedisService: jest.Mocked<{
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    deletePattern: jest.Mock;
  }>;
  let mockStorageService: jest.Mocked<{
    getSignedDownloadUrl: jest.Mock;
    getSignedUploadUrl: jest.Mock;
  }>;
  let mockLogger: jest.Mocked<{
    info: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
    debug: jest.Mock;
    verbose: jest.Mock;
  }>;

  const mockTrack: TrackDTO = {
    id: "uuid-1",
    title: "Morning Wind",
    artist: "Example Artist",
    album: "Sunrise Sessions",
    duration: 215,
    bitrate: 1411,
    sampleRate: 44100,
    format: "flac",
    storageKey: "tracks/uuid-1/master.flac",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  beforeEach(async () => {
    mockRepository = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
    };

    mockRedisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue("OK"),
      del: jest.fn().mockResolvedValue(1),
      deletePattern: jest.fn().mockResolvedValue(0),
    };

    mockStorageService = {
      getSignedDownloadUrl: jest.fn(),
      getSignedUploadUrl: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TracksService,
        { provide: TRACKS_REPOSITORY, useValue: mockRepository },
        { provide: RedisService, useValue: mockRedisService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: CMLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<TracksService>(TracksService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe("findAll", () => {
    const mockTracks: TrackDTO[] = [
      mockTrack,
      { ...mockTrack, id: "uuid-2", title: "Evening Calm", format: "wav" },
    ];

    it("should return cached tracks on cache hit", async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(mockTracks));

      const result = await service.findAll();

      expect(result).toEqual(
        mockTracks.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
      );
      expect(mockRedisService.get).toHaveBeenCalledWith("tracks:list:all");
      expect(mockRepository.findAll).not.toHaveBeenCalled();
    });

    it("should fetch from repository on cache miss and populate cache", async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findAll.mockResolvedValue(mockTracks);

      const result = await service.findAll();

      expect(result).toEqual(mockTracks);
      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(mockRedisService.set).toHaveBeenCalledWith(
        "tracks:list:all",
        JSON.stringify(mockTracks),
        60,
      );
    });

    it("should handle Redis read failure gracefully and fall back to DB", async () => {
      mockRedisService.get.mockRejectedValue(new Error("Redis timeout"));
      mockRepository.findAll.mockResolvedValue(mockTracks);

      const result = await service.findAll();

      expect(result).toEqual(mockTracks);
      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Cache read failed, falling back to DB"),
      );
    });

    it("should handle Redis write failure gracefully", async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findAll.mockResolvedValue(mockTracks);
      mockRedisService.set.mockRejectedValue(new Error("Redis OOM"));

      const result = await service.findAll();

      expect(result).toEqual(mockTracks);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Cache write failed"),
      );
    });

    it("should return empty array when no tracks exist", async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------------
  describe("findOne", () => {
    it("should return cached track on cache hit", async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(mockTrack));

      const result = await service.findOne("uuid-1");

      expect(result).toEqual({
        ...mockTrack,
        createdAt: mockTrack.createdAt.toISOString(),
      });
      expect(mockRedisService.get).toHaveBeenCalledWith("track:uuid-1");
      expect(mockRepository.findOne).not.toHaveBeenCalled();
    });

    it("should fetch from repository on cache miss and populate cache", async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mockTrack);

      const result = await service.findOne("uuid-1");

      expect(result).toEqual(mockTrack);
      expect(mockRepository.findOne).toHaveBeenCalledWith("uuid-1");
      expect(mockRedisService.set).toHaveBeenCalledWith(
        "track:uuid-1",
        JSON.stringify(mockTrack),
        300,
      );
    });

    it("should return null when track does not exist", async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne("non-existent");

      expect(result).toBeNull();
      expect(mockRedisService.set).not.toHaveBeenCalled();
    });

    it("should handle Redis read failure gracefully", async () => {
      mockRedisService.get.mockRejectedValue(new Error("Connection reset"));
      mockRepository.findOne.mockResolvedValue(mockTrack);

      const result = await service.findOne("uuid-1");

      expect(result).toEqual(mockTrack);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Cache read failed, falling back to DB"),
      );
    });

    it("should handle Redis write failure gracefully", async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mockTrack);
      mockRedisService.set.mockRejectedValue(new Error("Write error"));

      const result = await service.findOne("uuid-1");

      expect(result).toEqual(mockTrack);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Cache write failed"),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe("create", () => {
    const createDto: CreateTrackDTO = {
      title: "New Track",
      artist: "New Artist",
      duration: 180,
      format: "flac",
      storageKey: "tracks/uuid-3/master.flac",
    };

    it("should create track and invalidate list cache", async () => {
      mockRepository.create.mockResolvedValue({
        id: "uuid-3",
        ...createDto,
        createdAt: new Date(),
      } as TrackDTO);

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRedisService.del).toHaveBeenCalledWith("tracks:list:all");
      expect(result.title).toBe("New Track");
    });

    it("should handle cache invalidation failure gracefully", async () => {
      mockRepository.create.mockResolvedValue({
        id: "uuid-3",
        ...createDto,
        createdAt: new Date(),
      } as TrackDTO);
      mockRedisService.del.mockRejectedValue(new Error("Redis del failed"));

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Cache invalidation failed"),
      );
    });

    it("should create a WAV track", async () => {
      const wavDto: CreateTrackDTO = {
        ...createDto,
        format: "wav",
        storageKey: "tracks/uuid-4/master.wav",
      };
      mockRepository.create.mockResolvedValue({
        id: "uuid-4",
        ...wavDto,
        createdAt: new Date(),
      } as TrackDTO);

      const result = await service.create(wavDto);

      expect(result.format).toBe("wav");
    });
  });

  // ---------------------------------------------------------------------------
  // remove
  // ---------------------------------------------------------------------------
  describe("remove", () => {
    it("should remove track and invalidate per-track and list caches", async () => {
      mockRepository.remove.mockResolvedValue("uuid-1");

      const result = await service.remove("uuid-1");

      expect(result).toBe("uuid-1");
      expect(mockRedisService.del).toHaveBeenCalledWith(
        "track:uuid-1",
        "tracks:list:all",
      );
    });

    it("should return null and skip cache invalidation when track not found", async () => {
      mockRepository.remove.mockResolvedValue(null);

      const result = await service.remove("non-existent");

      expect(result).toBeNull();
      expect(mockRedisService.del).not.toHaveBeenCalled();
    });

    it("should handle cache invalidation failure gracefully", async () => {
      mockRepository.remove.mockResolvedValue("uuid-1");
      mockRedisService.del.mockRejectedValue(new Error("Redis error"));

      const result = await service.remove("uuid-1");

      expect(result).toBe("uuid-1");
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Cache invalidation failed"),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getPlayUrl
  // ---------------------------------------------------------------------------
  describe("getPlayUrl", () => {
    const expiresAt = new Date("2026-01-01T00:01:00.000Z");

    it("should return a signed stream URL for an existing FLAC track", async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mockTrack);
      mockStorageService.getSignedDownloadUrl.mockReturnValue({
        url: "https://cdn.example.com/tracks/uuid-1/master.flac?sig=abc",
        expiresAt,
      });

      const result = await service.getPlayUrl("uuid-1");

      expect(result).toEqual({
        streamUrl: "https://cdn.example.com/tracks/uuid-1/master.flac?sig=abc",
        expiresAt,
      });
      expect(mockStorageService.getSignedDownloadUrl).toHaveBeenCalledWith(
        mockTrack.storageKey,
        "uuid-1",
      );
    });

    it("should return a signed stream URL for an existing WAV track", async () => {
      const wavTrack: TrackDTO = {
        ...mockTrack,
        format: "wav",
        storageKey: "tracks/uuid-2/master.wav",
      };
      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(wavTrack);
      mockStorageService.getSignedDownloadUrl.mockReturnValue({
        url: "http://localhost:3456/tracks/uuid-2/stream?expires=123&sig=xyz",
        expiresAt,
      });

      const result = await service.getPlayUrl("uuid-2");

      expect(result.streamUrl).toContain("stream");
    });

    it("should return null when track does not exist", async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getPlayUrl("non-existent");

      expect(result).toBeNull();
      expect(mockStorageService.getSignedDownloadUrl).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // getUploadUrl
  // ---------------------------------------------------------------------------
  describe("getUploadUrl", () => {
    it("should delegate to StorageService and return an upload URL", () => {
      const expiresAt = new Date("2026-01-01T00:01:00.000Z");
      mockStorageService.getSignedUploadUrl.mockReturnValue({
        url: "https://r2.example.com/bucket/tracks/uuid-5/master.flac?sig=upload",
        expiresAt,
      });

      const result = service.getUploadUrl("tracks/uuid-5/master.flac");

      expect(mockStorageService.getSignedUploadUrl).toHaveBeenCalledWith(
        "tracks/uuid-5/master.flac",
      );
      expect(result.url).toContain("upload");
      expect(result.expiresAt).toEqual(expiresAt);
    });
  });
});
