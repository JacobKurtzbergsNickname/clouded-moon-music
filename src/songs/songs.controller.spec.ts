import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { SongsController } from "./songs.controller";
import { SongsService } from "./songs.service";
import CreateSongDTO from "./models/create-song.dto";
import { SongDTO } from "./models/song.dto";

describe("SongsController", () => {
  let controller: SongsController;
  let songsService: SongsService;

  const mockSongDTO: SongDTO = {
    id: "507f1f77bcf86cd799439011",
    title: "Test Song",
    artists: ["Test Artist"],
    album: "Test Album",
    year: 2024,
    genres: ["Rock"],
    duration: 225,
    releaseDate: new Date("2024-01-01"),
  };

  const mockSongsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    replace: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SongsController],
      providers: [
        {
          provide: SongsService,
          useValue: mockSongsService,
        },
      ],
    }).compile();

    controller = module.get<SongsController>(SongsController);
    songsService = module.get<SongsService>(SongsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should create a song", async () => {
      const dto: CreateSongDTO = {
        title: "Test Song",
        artists: ["Test Artist"],
        album: "Test Album",
        year: 2024,
        genres: ["Rock"],
        duration: 225,
        releaseDate: new Date("2024-01-01"),
      };

      mockSongsService.create.mockResolvedValue(mockSongDTO);

      const result = await controller.create(dto);

      expect(result).toEqual(mockSongDTO);
      expect(songsService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe("findAll", () => {
    it("should return all songs", async () => {
      mockSongsService.findAll.mockResolvedValue([mockSongDTO]);

      const result = await controller.findAll();

      expect(result).toEqual([mockSongDTO]);
      expect(songsService.findAll).toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should return a song by id", async () => {
      mockSongsService.findOne.mockResolvedValue(mockSongDTO);

      const result = await controller.findOne("507f1f77bcf86cd799439011");

      expect(result).toEqual(mockSongDTO);
      expect(songsService.findOne).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
      );
    });

    it("should throw NotFoundException when song not found", async () => {
      mockSongsService.findOne.mockResolvedValue(null);

      await expect(
        controller.findOne("507f1f77bcf86cd799439011"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("update", () => {
    it("should update a song", async () => {
      const updateDto = { title: "Updated Song" };
      const updatedSong = { ...mockSongDTO, title: "Updated Song" };
      mockSongsService.update.mockResolvedValue(updatedSong);

      const result = await controller.update(
        "507f1f77bcf86cd799439011",
        updateDto,
      );

      expect(result).toEqual(updatedSong);
      expect(songsService.update).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        updateDto,
      );
    });

    it("should throw NotFoundException when song not found", async () => {
      mockSongsService.update.mockResolvedValue(null);

      await expect(
        controller.update("507f1f77bcf86cd799439011", { title: "Updated" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("replace", () => {
    it("should replace a song", async () => {
      const replaceDto: CreateSongDTO = {
        title: "Replaced Song",
        artists: ["New Artist"],
        album: "New Album",
        year: 2025,
        genres: ["Pop"],
        duration: 240,
        releaseDate: new Date("2025-01-01"),
      };

      const replacedSong = { ...mockSongDTO, ...replaceDto };
      mockSongsService.replace.mockResolvedValue(replacedSong);

      const result = await controller.replace(
        "507f1f77bcf86cd799439011",
        replaceDto,
      );

      expect(result).toEqual(replacedSong);
      expect(songsService.replace).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        replaceDto,
      );
    });

    it("should throw NotFoundException when song not found", async () => {
      const replaceDto: CreateSongDTO = {
        title: "Replaced Song",
        artists: ["New Artist"],
        album: "New Album",
        year: 2025,
        genres: ["Pop"],
        duration: 240,
        releaseDate: new Date("2025-01-01"),
      };
      mockSongsService.replace.mockResolvedValue(null);

      await expect(
        controller.replace("507f1f77bcf86cd799439011", replaceDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    it("should remove a song", async () => {
      mockSongsService.remove.mockResolvedValue("507f1f77bcf86cd799439011");

      await controller.remove("507f1f77bcf86cd799439011");

      expect(songsService.remove).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
      );
    });

    it("should throw NotFoundException when song not found", async () => {
      mockSongsService.remove.mockResolvedValue(null);

      await expect(
        controller.remove("507f1f77bcf86cd799439011"),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
