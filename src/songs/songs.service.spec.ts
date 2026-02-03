import { Test, TestingModule } from "@nestjs/testing";
import { SongsService } from "./songs.service";
import { CMLogger } from "src/common/logger";
import { Song } from "./models/song.entity";

const mockLogger = {
  info: jest.fn(),
};

describe("SongsService", () => {
  let service: SongsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SongsService,
        {
          provide: CMLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<SongsService>(SongsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("returns all songs and logs access", () => {
    const songs = service.findAll();

    expect(songs).toHaveLength(4);
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Method: findAll()",
      expect.objectContaining({
        level: "info",
        message: "Getting all songs",
        context: "SongsService",
      }),
    );
  });

  it("returns a song by id", () => {
    const song = service.findOne(1) as Song;

    expect(song).toEqual(
      expect.objectContaining({
        id: 1,
        title: "The Call of the Mountains",
      }),
    );
  });

  it("returns not found when song is missing", () => {
    const result = service.findOne(999);

    expect(result).toBe("Not found");
  });

  it("creates a new song entry", () => {
    const newSong = service.create({
      title: "Alfadhirhaiti",
      artists: ["Heilung"],
      album: "Ofnir",
      year: 2015,
      genres: ["Neofolk"],
      duration: new Date("06:18"),
      releaseDate: new Date("2015-01-01T00:00:00Z"),
    });

    expect(newSong).toEqual(
      expect.objectContaining({
        id: 5,
        title: "Alfadhirhaiti",
      }),
    );
    expect(service.findAll()).toHaveLength(5);
  });

  it("updates an existing song", () => {
    const updated = service.update(0, {
      title: "Uppsala",
      artists: ["Wardruna"],
      album: "Runaljod - Yggdrasil",
      year: 2013,
      genres: ["Nordic Folk"],
      duration: new Date("05:12"),
      releaseDate: new Date("2013-01-01T00:00:00Z"),
    });

    expect(updated).toEqual(
      expect.objectContaining({
        id: 0,
        title: "Uppsala",
      }),
    );
    expect(service.findOne(0)).toEqual(
      expect.objectContaining({
        id: 0,
        title: "Uppsala",
      }),
    );
  });

  it("replaces an existing song", () => {
    const replacement: Song = {
      id: 1,
      title: "Lyfjaberg",
      artists: ["Wardruna"],
      album: "Runaljod - Yggdrasil",
      year: 2013,
      genres: ["Nordic Folk"],
      duration: new Date("07:15"),
      releaseDate: new Date("2013-01-01T00:00:00Z"),
    };

    const result = service.replace(1, replacement);

    expect(result).toEqual(replacement);
    expect(service.findOne(1)).toEqual(replacement);
  });

  it("removes a song by id", () => {
    const removedId = service.remove(3);

    expect(removedId).toBe(3);
    expect(service.findAll()).toHaveLength(3);
  });

  it("returns null when removing missing song", () => {
    const removedId = service.remove(999);

    expect(removedId).toBeNull();
  });
});
