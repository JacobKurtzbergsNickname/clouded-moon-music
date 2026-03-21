import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SqlTracksRepository } from "./sql-tracks.repository";
import { Track } from "../models/track.entity";
import { TrackDTO } from "../models/track.dto";

describe("SqlTracksRepository", () => {
  let repository: SqlTracksRepository;
  let typeormRepo: jest.Mocked<Repository<Track>>;

  const mockTrackEntity: Track = {
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

  const expectedDTO: TrackDTO = {
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

  const mockTypeormRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SqlTracksRepository,
        {
          provide: getRepositoryToken(Track),
          useValue: mockTypeormRepo,
        },
      ],
    }).compile();

    repository = module.get<SqlTracksRepository>(SqlTracksRepository);
    typeormRepo = module.get(getRepositoryToken(Track));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe("findAll", () => {
    it("should return an array of track DTOs ordered by createdAt DESC", async () => {
      mockTypeormRepo.find.mockResolvedValue([mockTrackEntity]);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expectedDTO);
      expect(typeormRepo.find).toHaveBeenCalledWith({
        order: { createdAt: "DESC" },
      });
    });

    it("should return empty array when no tracks exist", async () => {
      mockTypeormRepo.find.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });

    it("should map all fields correctly", async () => {
      const wavTrack: Track = {
        ...mockTrackEntity,
        id: "uuid-2",
        format: "wav",
        storageKey: "tracks/uuid-2/master.wav",
      };
      mockTypeormRepo.find.mockResolvedValue([mockTrackEntity, wavTrack]);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[1].format).toBe("wav");
      expect(result[1].storageKey).toBe("tracks/uuid-2/master.wav");
    });

    it("should handle nullable optional fields", async () => {
      const minimalTrack: Track = {
        ...mockTrackEntity,
        album: null,
        bitrate: null,
        sampleRate: null,
      };
      mockTypeormRepo.find.mockResolvedValue([minimalTrack]);

      const result = await repository.findAll();

      expect(result[0].album).toBeNull();
      expect(result[0].bitrate).toBeNull();
      expect(result[0].sampleRate).toBeNull();
    });

    it("should propagate database errors", async () => {
      mockTypeormRepo.find.mockRejectedValue(new Error("DB connection lost"));

      await expect(repository.findAll()).rejects.toThrow("DB connection lost");
    });
  });

  // ---------------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------------
  describe("findOne", () => {
    it("should return a track DTO for a valid id", async () => {
      mockTypeormRepo.findOne.mockResolvedValue(mockTrackEntity);

      const result = await repository.findOne("uuid-1");

      expect(result).toEqual(expectedDTO);
      expect(typeormRepo.findOne).toHaveBeenCalledWith({
        where: { id: "uuid-1" },
      });
    });

    it("should return null when track is not found", async () => {
      mockTypeormRepo.findOne.mockResolvedValue(null);

      const result = await repository.findOne("non-existent-id");

      expect(result).toBeNull();
    });

    it("should propagate database errors", async () => {
      mockTypeormRepo.findOne.mockRejectedValue(new Error("Query timeout"));

      await expect(repository.findOne("uuid-1")).rejects.toThrow(
        "Query timeout",
      );
    });
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe("create", () => {
    const createDto = {
      title: "Evening Calm",
      artist: "Another Artist",
      album: "Night Sessions",
      duration: 180,
      bitrate: 1411,
      sampleRate: 44100,
      format: "flac" as const,
      storageKey: "tracks/uuid-3/master.flac",
    };

    it("should create and return a track DTO", async () => {
      const savedEntity: Track = {
        id: "uuid-3",
        ...createDto,
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
      };
      mockTypeormRepo.create.mockReturnValue(savedEntity);
      mockTypeormRepo.save.mockResolvedValue(savedEntity);

      const result = await repository.create(createDto);

      expect(typeormRepo.create).toHaveBeenCalledWith(createDto);
      expect(typeormRepo.save).toHaveBeenCalledWith(savedEntity);
      expect(result.id).toBe("uuid-3");
      expect(result.title).toBe("Evening Calm");
      expect(result.format).toBe("flac");
    });

    it("should create a WAV track", async () => {
      const wavDto = {
        ...createDto,
        format: "wav" as const,
        storageKey: "tracks/uuid-4/master.wav",
      };
      const savedEntity: Track = {
        id: "uuid-4",
        ...wavDto,
        createdAt: new Date("2026-01-03T00:00:00.000Z"),
      };
      mockTypeormRepo.create.mockReturnValue(savedEntity);
      mockTypeormRepo.save.mockResolvedValue(savedEntity);

      const result = await repository.create(wavDto);

      expect(result.format).toBe("wav");
    });

    it("should propagate save errors", async () => {
      mockTypeormRepo.create.mockReturnValue(createDto as any);
      mockTypeormRepo.save.mockRejectedValue(
        new Error("Unique constraint violation"),
      );

      await expect(repository.create(createDto)).rejects.toThrow(
        "Unique constraint violation",
      );
    });
  });

  // ---------------------------------------------------------------------------
  // remove
  // ---------------------------------------------------------------------------
  describe("remove", () => {
    it("should remove a track and return its id", async () => {
      mockTypeormRepo.findOne.mockResolvedValue(mockTrackEntity);
      mockTypeormRepo.remove.mockResolvedValue(mockTrackEntity);

      const result = await repository.remove("uuid-1");

      expect(result).toBe("uuid-1");
      expect(typeormRepo.findOne).toHaveBeenCalledWith({
        where: { id: "uuid-1" },
      });
      expect(typeormRepo.remove).toHaveBeenCalledWith(mockTrackEntity);
    });

    it("should return null when track to remove does not exist", async () => {
      mockTypeormRepo.findOne.mockResolvedValue(null);

      const result = await repository.remove("non-existent");

      expect(result).toBeNull();
      expect(typeormRepo.remove).not.toHaveBeenCalled();
    });

    it("should propagate database errors during remove", async () => {
      mockTypeormRepo.findOne.mockResolvedValue(mockTrackEntity);
      mockTypeormRepo.remove.mockRejectedValue(new Error("Delete failed"));

      await expect(repository.remove("uuid-1")).rejects.toThrow(
        "Delete failed",
      );
    });
  });
});
