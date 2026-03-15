import { Test, TestingModule } from "@nestjs/testing";
import { SongsController } from "./songs.controller";
import { SongsService } from "./songs.service";
import CreateSongDTO from "./models/create-song.dto";
import { SongDTO } from "./models/song.dto";

describe("SongsController", () => {
  let controller: SongsController;
  let songsService: SongsService;

  const mockSongDTO: SongDTO = {
    id: "1",
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

      const result = await controller.findOne("1");

      expect(result).toEqual(mockSongDTO);
      expect(songsService.findOne).toHaveBeenCalledWith("1");
    });
  });

  describe("update", () => {
    it("should update a song", async () => {
      const updateDto = { title: "Updated Song" };
      const updatedSong = { ...mockSongDTO, title: "Updated Song" };
      mockSongsService.update.mockResolvedValue(updatedSong);

      const result = await controller.update("1", updateDto);

      expect(result).toEqual(updatedSong);
      expect(songsService.update).toHaveBeenCalledWith("1", updateDto);
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

      const replacedSong = { ...mockSongDTO, ...replaceDto, id: "1" };
      mockSongsService.replace.mockResolvedValue(replacedSong);

      const result = await controller.replace("1", replaceDto);

      expect(result).toEqual(replacedSong);
      expect(songsService.replace).toHaveBeenCalledWith("1", replaceDto);
    });
  });

  describe("remove", () => {
    it("should remove a song", async () => {
      mockSongsService.remove.mockResolvedValue("1");

      const result = await controller.remove("1");

      expect(result).toBe("1");
      expect(songsService.remove).toHaveBeenCalledWith("1");
    });
  });
});
