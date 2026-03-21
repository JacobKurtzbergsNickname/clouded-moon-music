import { Test, TestingModule } from "@nestjs/testing";
import { CMLogger } from "../common/logger";
import { RedisService } from "../redis/redis.service";
import { PlaylistsService } from "./playlists.service";
import { PLAYLISTS_REPOSITORY } from "./repositories/playlists.repository";
import { PlaylistDTO } from "./models/playlist.dto";
import { CreatePlaylistDTO } from "./models/create-playlist.dto";

describe("PlaylistsService", () => {
  let service: PlaylistsService;
  let mockRepository: any;
  let mockRedisService: any;
  let mockLogger: any;

  const mockPlaylist: PlaylistDTO = {
    id: "64a1f2e3b4c5d6e7f8a9b0c1",
    name: "My Favorites",
    description: "Songs I love",
    songs: ["64a1f2e3b4c5d6e7f8a9b0c2"],
  };

  beforeEach(async () => {
    mockRepository = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByIds: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      addSong: jest.fn(),
      removeSong: jest.fn(),
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
        PlaylistsService,
        {
          provide: PLAYLISTS_REPOSITORY,
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

    service = module.get<PlaylistsService>(PlaylistsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return cached playlists on cache hit", async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify([mockPlaylist]));

      const result = await service.findAll();

      expect(result).toEqual([mockPlaylist]);
      expect(mockRepository.findAll).not.toHaveBeenCalled();
    });

    it("should fetch from DB on cache miss and populate cache", async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findAll.mockResolvedValue([mockPlaylist]);

      const result = await service.findAll();

      expect(result).toEqual([mockPlaylist]);
      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(mockRedisService.set).toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should return cached playlist on cache hit", async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(mockPlaylist));

      const result = await service.findOne(mockPlaylist.id);

      expect(result).toEqual(mockPlaylist);
      expect(mockRepository.findOne).not.toHaveBeenCalled();
    });

    it("should fetch from DB on cache miss", async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mockPlaylist);

      const result = await service.findOne(mockPlaylist.id);

      expect(result).toEqual(mockPlaylist);
      expect(mockRepository.findOne).toHaveBeenCalledWith(mockPlaylist.id);
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it("should return null when playlist not found", async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("findByIds", () => {
    it("should call repository findByIds and bypass cache", async () => {
      const ids = [mockPlaylist.id];
      mockRepository.findByIds.mockResolvedValue([mockPlaylist]);

      const result = await service.findByIds(ids);

      expect(result).toEqual([mockPlaylist]);
      expect(mockRepository.findByIds).toHaveBeenCalledWith(ids);
      expect(mockRedisService.get).not.toHaveBeenCalled();
    });
  });

  describe("create", () => {
    it("should create a playlist and invalidate list cache", async () => {
      const dto: CreatePlaylistDTO = {
        name: "My Favorites",
        description: "Songs I love",
        songs: [],
      };
      mockRepository.create.mockResolvedValue(mockPlaylist);

      const result = await service.create(dto);

      expect(result).toEqual(mockPlaylist);
      expect(mockRepository.create).toHaveBeenCalledWith(dto);
      expect(mockRedisService.del).toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should update a playlist and invalidate caches", async () => {
      const dto = { name: "Updated Name" };
      const updated = { ...mockPlaylist, name: "Updated Name" };
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update(mockPlaylist.id, dto);

      expect(result).toEqual(updated);
      expect(mockRepository.update).toHaveBeenCalledWith(mockPlaylist.id, dto);
      expect(mockRedisService.del).toHaveBeenCalled();
    });

    it("should return null if playlist not found", async () => {
      mockRepository.update.mockResolvedValue(null);

      const result = await service.update("nonexistent", { name: "Test" });

      expect(result).toBeNull();
    });
  });

  describe("remove", () => {
    it("should remove a playlist and invalidate caches", async () => {
      mockRepository.remove.mockResolvedValue(mockPlaylist.id);

      const result = await service.remove(mockPlaylist.id);

      expect(result).toBe(mockPlaylist.id);
      expect(mockRepository.remove).toHaveBeenCalledWith(mockPlaylist.id);
      expect(mockRedisService.del).toHaveBeenCalled();
    });

    it("should return null if playlist not found", async () => {
      mockRepository.remove.mockResolvedValue(null);

      const result = await service.remove("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("addSong", () => {
    it("should add a song to a playlist and invalidate caches", async () => {
      const songId = "64a1f2e3b4c5d6e7f8a9b0c3";
      const updatedPlaylist = {
        ...mockPlaylist,
        songs: [...mockPlaylist.songs, songId],
      };
      mockRepository.addSong.mockResolvedValue(updatedPlaylist);

      const result = await service.addSong(mockPlaylist.id, songId);

      expect(result).toEqual(updatedPlaylist);
      expect(mockRepository.addSong).toHaveBeenCalledWith(
        mockPlaylist.id,
        songId,
      );
      expect(mockRedisService.del).toHaveBeenCalled();
    });

    it("should return null if playlist not found", async () => {
      mockRepository.addSong.mockResolvedValue(null);

      const result = await service.addSong("nonexistent", "songId");

      expect(result).toBeNull();
    });
  });

  describe("removeSong", () => {
    it("should remove a song from a playlist and invalidate caches", async () => {
      const songId = mockPlaylist.songs[0];
      const updatedPlaylist = { ...mockPlaylist, songs: [] };
      mockRepository.removeSong.mockResolvedValue(updatedPlaylist);

      const result = await service.removeSong(mockPlaylist.id, songId);

      expect(result).toEqual(updatedPlaylist);
      expect(mockRepository.removeSong).toHaveBeenCalledWith(
        mockPlaylist.id,
        songId,
      );
      expect(mockRedisService.del).toHaveBeenCalled();
    });

    it("should return null if playlist not found", async () => {
      mockRepository.removeSong.mockResolvedValue(null);

      const result = await service.removeSong("nonexistent", "songId");

      expect(result).toBeNull();
    });
  });
});
