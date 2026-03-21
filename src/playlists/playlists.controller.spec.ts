import { Test, TestingModule } from "@nestjs/testing";
import { PlaylistsController } from "./playlists.controller";
import { PlaylistsService } from "./playlists.service";
import { CreatePlaylistDTO } from "./models/create-playlist.dto";
import { PlaylistDTO } from "./models/playlist.dto";

describe("PlaylistsController", () => {
  let controller: PlaylistsController;
  let playlistsService: PlaylistsService;

  const mockPlaylistDTO: PlaylistDTO = {
    id: "64a1f2e3b4c5d6e7f8a9b0c1",
    name: "My Favorites",
    description: "Songs I love",
    songs: ["64a1f2e3b4c5d6e7f8a9b0c2"],
  };

  const mockPlaylistsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addSong: jest.fn(),
    removeSong: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlaylistsController],
      providers: [
        {
          provide: PlaylistsService,
          useValue: mockPlaylistsService,
        },
      ],
    }).compile();

    controller = module.get<PlaylistsController>(PlaylistsController);
    playlistsService = module.get<PlaylistsService>(PlaylistsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should create a playlist", async () => {
      const dto: CreatePlaylistDTO = {
        name: "My Favorites",
        description: "Songs I love",
        songs: [],
      };
      mockPlaylistsService.create.mockResolvedValue(mockPlaylistDTO);

      const result = await controller.create(dto);

      expect(result).toEqual(mockPlaylistDTO);
      expect(playlistsService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe("findAll", () => {
    it("should return all playlists", async () => {
      mockPlaylistsService.findAll.mockResolvedValue([mockPlaylistDTO]);

      const result = await controller.findAll();

      expect(result).toEqual([mockPlaylistDTO]);
      expect(playlistsService.findAll).toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should return a playlist by id", async () => {
      mockPlaylistsService.findOne.mockResolvedValue(mockPlaylistDTO);

      const result = await controller.findOne(mockPlaylistDTO.id);

      expect(result).toEqual(mockPlaylistDTO);
      expect(playlistsService.findOne).toHaveBeenCalledWith(mockPlaylistDTO.id);
    });
  });

  describe("update", () => {
    it("should update a playlist", async () => {
      const dto = { name: "Updated Name" };
      const updated = { ...mockPlaylistDTO, name: "Updated Name" };
      mockPlaylistsService.update.mockResolvedValue(updated);

      const result = await controller.update(mockPlaylistDTO.id, dto);

      expect(result).toEqual(updated);
      expect(playlistsService.update).toHaveBeenCalledWith(
        mockPlaylistDTO.id,
        dto,
      );
    });
  });

  describe("remove", () => {
    it("should remove a playlist", async () => {
      mockPlaylistsService.remove.mockResolvedValue(mockPlaylistDTO.id);

      const result = await controller.remove(mockPlaylistDTO.id);

      expect(result).toBe(mockPlaylistDTO.id);
      expect(playlistsService.remove).toHaveBeenCalledWith(mockPlaylistDTO.id);
    });
  });

  describe("addSong", () => {
    it("should add a song to a playlist", async () => {
      const songId = "64a1f2e3b4c5d6e7f8a9b0c3";
      const updated = {
        ...mockPlaylistDTO,
        songs: [...mockPlaylistDTO.songs, songId],
      };
      mockPlaylistsService.addSong.mockResolvedValue(updated);

      const result = await controller.addSong(mockPlaylistDTO.id, songId);

      expect(result).toEqual(updated);
      expect(playlistsService.addSong).toHaveBeenCalledWith(
        mockPlaylistDTO.id,
        songId,
      );
    });
  });

  describe("removeSong", () => {
    it("should remove a song from a playlist", async () => {
      const songId = mockPlaylistDTO.songs[0];
      const updated = { ...mockPlaylistDTO, songs: [] };
      mockPlaylistsService.removeSong.mockResolvedValue(updated);

      const result = await controller.removeSong(mockPlaylistDTO.id, songId);

      expect(result).toEqual(updated);
      expect(playlistsService.removeSong).toHaveBeenCalledWith(
        mockPlaylistDTO.id,
        songId,
      );
    });
  });
});
