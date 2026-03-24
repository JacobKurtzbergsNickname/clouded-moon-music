import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, UnauthorizedException } from "@nestjs/common";
import { Response } from "express";
import { TracksController } from "./tracks.controller";
import { TracksService } from "./tracks.service";
import { StorageService } from "../storage/storage.service";
import { TrackDTO } from "./models/track.dto";
import { CreateTrackDTO } from "./models/create-track.dto";

// ---------------------------------------------------------------------------
// Mock only the fs functions used by the stream endpoint.
// We spread the real module first so that other packages (e.g. winston's
// DailyRotateFile transport) that depend on fs.mkdirSync etc. still work.
// ---------------------------------------------------------------------------
jest.mock("fs", () => ({
  ...jest.requireActual<typeof import("fs")>("fs"),
  existsSync: jest.fn(),
  statSync: jest.fn(),
  createReadStream: jest.fn(),
}));

import { existsSync, statSync, createReadStream } from "fs";

describe("TracksController", () => {
  let controller: TracksController;
  let tracksService: jest.Mocked<TracksService>;
  let storageService: jest.Mocked<StorageService>;

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

  const mockTracksService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    getPlayUrl: jest.fn(),
    getUploadUrl: jest.fn(),
  };

  const mockStorageService = {
    getSignedDownloadUrl: jest.fn(),
    getSignedUploadUrl: jest.fn(),
    verifyLocalSignature: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TracksController],
      providers: [
        { provide: TracksService, useValue: mockTracksService },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    controller = module.get<TracksController>(TracksController);
    tracksService = module.get(TracksService);
    storageService = module.get(StorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.NODE_ENV;
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // POST /tracks
  // ---------------------------------------------------------------------------
  describe("create", () => {
    const dto: CreateTrackDTO = {
      title: "New Track",
      artist: "New Artist",
      duration: 180,
      format: "flac",
      storageKey: "tracks/uuid-3/master.flac",
    };

    it("should create a track", async () => {
      const created = {
        id: "uuid-3",
        ...dto,
        createdAt: new Date(),
      } as TrackDTO;
      mockTracksService.create.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(result).toEqual(created);
      expect(tracksService.create).toHaveBeenCalledWith(dto);
    });

    it("should create a WAV track", async () => {
      const wavDto: CreateTrackDTO = {
        ...dto,
        format: "wav",
        storageKey: "tracks/uuid-4/master.wav",
      };
      const created = {
        id: "uuid-4",
        ...wavDto,
        createdAt: new Date(),
      } as TrackDTO;
      mockTracksService.create.mockResolvedValue(created);

      const result = await controller.create(wavDto);

      expect(result.format).toBe("wav");
    });
  });

  // ---------------------------------------------------------------------------
  // GET /tracks
  // ---------------------------------------------------------------------------
  describe("findAll", () => {
    it("should return all tracks", async () => {
      mockTracksService.findAll.mockResolvedValue([mockTrack]);

      const result = await controller.findAll();

      expect(result).toEqual([mockTrack]);
      expect(tracksService.findAll).toHaveBeenCalled();
    });

    it("should return empty array when no tracks exist", async () => {
      mockTracksService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /tracks/:id
  // ---------------------------------------------------------------------------
  describe("findOne", () => {
    it("should return track metadata for a valid id", async () => {
      mockTracksService.findOne.mockResolvedValue(mockTrack);

      const result = await controller.findOne("uuid-1");

      expect(result).toEqual(mockTrack);
      expect(tracksService.findOne).toHaveBeenCalledWith("uuid-1");
    });

    it("should throw NotFoundException when track does not exist", async () => {
      mockTracksService.findOne.mockResolvedValue(null);

      await expect(controller.findOne("non-existent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /tracks/:id
  // ---------------------------------------------------------------------------
  describe("remove", () => {
    it("should delete a track and return its id", async () => {
      mockTracksService.remove.mockResolvedValue("uuid-1");

      const result = await controller.remove("uuid-1");

      expect(result).toEqual({ deleted: "uuid-1" });
      expect(tracksService.remove).toHaveBeenCalledWith("uuid-1");
    });

    it("should throw NotFoundException when track does not exist", async () => {
      mockTracksService.remove.mockResolvedValue(null);

      await expect(controller.remove("non-existent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // GET /tracks/:id/play
  // ---------------------------------------------------------------------------
  describe("play", () => {
    const expiresAt = new Date("2026-01-01T00:01:00.000Z");

    it("should return a signed stream URL for a FLAC track", async () => {
      mockTracksService.getPlayUrl.mockResolvedValue({
        streamUrl: "https://cdn.example.com/tracks/uuid-1/master.flac?sig=abc",
        expiresAt,
      });

      const result = await controller.play("uuid-1");

      expect(result.streamUrl).toContain("master.flac");
      expect(result.expiresAt).toEqual(expiresAt);
      expect(tracksService.getPlayUrl).toHaveBeenCalledWith("uuid-1");
    });

    it("should return a signed stream URL for a WAV track", async () => {
      mockTracksService.getPlayUrl.mockResolvedValue({
        streamUrl: "https://cdn.example.com/tracks/uuid-2/master.wav?sig=def",
        expiresAt,
      });

      const result = await controller.play("uuid-2");

      expect(result.streamUrl).toContain("master.wav");
    });

    it("should throw NotFoundException when track does not exist", async () => {
      mockTracksService.getPlayUrl.mockResolvedValue(null);

      await expect(controller.play("non-existent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // POST /tracks/upload
  // ---------------------------------------------------------------------------
  describe("requestUpload", () => {
    it("should return a signed upload URL", async () => {
      const expiresAt = new Date("2026-01-01T00:01:00.000Z");
      mockTracksService.getUploadUrl.mockResolvedValue({
        url: "https://r2.example.com/tracks/uuid-5/master.flac?sig=upload",
        expiresAt,
      });

      const result = await controller.requestUpload(
        "tracks/uuid-5/master.flac",
      );

      expect(result).toEqual({
        uploadUrl:
          "https://r2.example.com/tracks/uuid-5/master.flac?sig=upload",
        expiresAt,
      });
      expect(tracksService.getUploadUrl).toHaveBeenCalledWith(
        "tracks/uuid-5/master.flac",
      );
    });

    it("should generate a WAV upload URL", async () => {
      const expiresAt = new Date("2026-01-01T00:01:00.000Z");
      mockTracksService.getUploadUrl.mockResolvedValue({
        url: "https://r2.example.com/tracks/uuid-6/master.wav?sig=upload",
        expiresAt,
      });

      const result = await controller.requestUpload("tracks/uuid-6/master.wav");

      expect(result.uploadUrl).toContain("master.wav");
    });
  });

  // ---------------------------------------------------------------------------
  // GET /tracks/:id/stream  (dev-only)
  // ---------------------------------------------------------------------------
  describe("stream", () => {
    const mockRes = {
      setHeader: jest.fn(),
    } as unknown as Response;

    beforeEach(() => {
      // Default: development environment
      process.env.NODE_ENV = "development";
    });

    it("should stream a FLAC file with correct headers in development", async () => {
      mockStorageService.verifyLocalSignature.mockReturnValue(true);
      mockTracksService.findOne.mockResolvedValue(mockTrack);
      (existsSync as jest.Mock).mockReturnValue(true);
      (statSync as jest.Mock).mockReturnValue({ size: 10485760 }); // 10 MB
      const mockReadStream = { pipe: jest.fn() };
      (createReadStream as jest.Mock).mockReturnValue(mockReadStream);

      const expires = String(Date.now() + 60000);
      await controller.stream("uuid-1", expires, "validSig", mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "audio/flac",
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Content-Length",
        10485760,
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith("Accept-Ranges", "bytes");
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Cache-Control",
        "no-store",
      );
      expect(mockReadStream.pipe).toHaveBeenCalledWith(mockRes);
    });

    it("should stream a WAV file with audio/wav content type", async () => {
      const wavTrack: TrackDTO = {
        ...mockTrack,
        format: "wav",
        storageKey: "tracks/uuid-2/master.wav",
      };
      mockStorageService.verifyLocalSignature.mockReturnValue(true);
      mockTracksService.findOne.mockResolvedValue(wavTrack);
      (existsSync as jest.Mock).mockReturnValue(true);
      (statSync as jest.Mock).mockReturnValue({ size: 52428800 }); // 50 MB
      const mockReadStream = { pipe: jest.fn() };
      (createReadStream as jest.Mock).mockReturnValue(mockReadStream);

      const expires = String(Date.now() + 60000);
      await controller.stream("uuid-2", expires, "validSig", mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "audio/wav",
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Content-Length",
        52428800,
      );
    });

    it("should throw NotFoundException in production", async () => {
      process.env.NODE_ENV = "production";

      const expires = String(Date.now() + 60000);
      await expect(
        controller.stream("uuid-1", expires, "sig", mockRes),
      ).rejects.toThrow(NotFoundException);

      expect(storageService.verifyLocalSignature).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException for invalid signature", async () => {
      mockStorageService.verifyLocalSignature.mockReturnValue(false);

      const expires = String(Date.now() + 60000);
      await expect(
        controller.stream("uuid-1", expires, "badSig", mockRes),
      ).rejects.toThrow(UnauthorizedException);

      expect(tracksService.findOne).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException for expired signature", async () => {
      mockStorageService.verifyLocalSignature.mockReturnValue(false);

      const expires = String(Date.now() - 1000); // already expired
      await expect(
        controller.stream("uuid-1", expires, "anySig", mockRes),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw NotFoundException when track does not exist", async () => {
      mockStorageService.verifyLocalSignature.mockReturnValue(true);
      mockTracksService.findOne.mockResolvedValue(null);

      const expires = String(Date.now() + 60000);
      await expect(
        controller.stream("non-existent", expires, "sig", mockRes),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException when audio file is missing from disk", async () => {
      mockStorageService.verifyLocalSignature.mockReturnValue(true);
      mockTracksService.findOne.mockResolvedValue(mockTrack);
      (existsSync as jest.Mock).mockReturnValue(false);

      const expires = String(Date.now() + 60000);
      await expect(
        controller.stream("uuid-1", expires, "sig", mockRes),
      ).rejects.toThrow(NotFoundException);

      expect(createReadStream).not.toHaveBeenCalled();
    });

    it("should reject path traversal attempts in storage key", async () => {
      const maliciousTrack: TrackDTO = {
        ...mockTrack,
        storageKey: "../../etc/passwd",
      };
      mockStorageService.verifyLocalSignature.mockReturnValue(true);
      mockTracksService.findOne.mockResolvedValue(maliciousTrack);

      const expires = String(Date.now() + 60000);
      await expect(
        controller.stream("uuid-1", expires, "sig", mockRes),
      ).rejects.toThrow(NotFoundException);

      expect(createReadStream).not.toHaveBeenCalled();
    });
  });
});
