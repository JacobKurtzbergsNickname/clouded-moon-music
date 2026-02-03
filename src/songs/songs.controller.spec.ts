import { Test, TestingModule } from "@nestjs/testing";
import { SongsController } from "./songs.controller";
import { SongsService } from "./songs.service";
import { Song } from "./models/song.entity";

describe("SongsController", () => {
  let controller: SongsController;
  let service: SongsService;

  const songsServiceMock = {
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
          useValue: songsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<SongsController>(SongsController);
    service = module.get<SongsService>(SongsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("creates a song", () => {
    const payload = {
      title: "Tyr",
      artists: ["Danheim"],
      album: "Mannavegr",
      year: 2017,
      genres: ["Nordic"],
      duration: new Date("04:08"),
      releaseDate: new Date("2017-01-01T00:00:00Z"),
    };
    songsServiceMock.create.mockReturnValue({ id: 1, ...payload });

    expect(controller.create(payload)).toEqual({ id: 1, ...payload });
    expect(service.create).toHaveBeenCalledWith(payload);
  });

  it("returns all songs", () => {
    songsServiceMock.findAll.mockReturnValue([{ id: 0, title: "Song" }]);

    expect(controller.findAll()).toEqual([{ id: 0, title: "Song" }]);
    expect(service.findAll).toHaveBeenCalled();
  });

  it("returns one song", () => {
    songsServiceMock.findOne.mockReturnValue({ id: 2, title: "Song" });

    expect(controller.findOne(2)).toEqual({ id: 2, title: "Song" });
    expect(service.findOne).toHaveBeenCalledWith(2);
  });

  it("updates a song", () => {
    const response = { id: 1, title: "Helvegen" } as Song;
    songsServiceMock.update.mockReturnValue(response);

    expect(controller.update(1)).toEqual(response);
    expect(service.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        title: "Helvegen",
        album: "Runaljod - Yggdrasil",
      }),
    );
  });

  it("replaces a song", () => {
    const response = { id: 2, title: "Helvegen" } as Song;
    songsServiceMock.replace.mockReturnValue(response);

    expect(controller.replace(2)).toEqual(response);
    expect(service.replace).toHaveBeenCalledWith(
      2,
      expect.objectContaining({
        id: 2,
        title: "Helvegen",
      }),
    );
  });

  it("removes a song", () => {
    songsServiceMock.remove.mockReturnValue(1);

    expect(controller.remove(1)).toBe(1);
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
