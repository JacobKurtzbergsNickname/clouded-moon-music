import { Test, TestingModule } from "@nestjs/testing";
import { SongsResolver } from "./songs.resolver";
import { GraphqlSongsService } from "../graphql.service";
import { DataLoadersService } from "../dataloaders/dataloaders.service";
import { SongType } from "../models/song.type";

describe("SongsResolver", () => {
  let resolver: SongsResolver;
  let graphqlSongsService: GraphqlSongsService;
  let dataLoadersService: DataLoadersService;

  beforeEach(async () => {
    const mockGraphqlSongsService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const mockDataLoadersService = {
      artistLoader: {
        load: jest.fn(),
      },
      genreLoader: {
        load: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SongsResolver,
        {
          provide: GraphqlSongsService,
          useValue: mockGraphqlSongsService,
        },
        {
          provide: DataLoadersService,
          useValue: mockDataLoadersService,
        },
      ],
    }).compile();

    resolver = module.get<SongsResolver>(SongsResolver);
    graphqlSongsService = module.get<GraphqlSongsService>(GraphqlSongsService);
    dataLoadersService = module.get<DataLoadersService>(DataLoadersService);
  });

  it("should be defined", () => {
    expect(resolver).toBeDefined();
  });

  describe("findAll", () => {
    it("should return all songs", async () => {
      const mockSongs: SongType[] = [
        {
          id: "1",
          title: "Test Song",
          album: "Test Album",
          year: 2020,
          duration: 180,
          releaseDate: new Date(),
        } as SongType,
      ];

      jest.spyOn(graphqlSongsService, "findAll").mockResolvedValue(mockSongs);

      const result = await resolver.findAll();
      expect(result).toEqual(mockSongs);
    });
  });

  describe("findOne", () => {
    it("should return a song by id", async () => {
      const mockSong: SongType = {
        id: "1",
        title: "Test Song",
        album: "Test Album",
        year: 2020,
        duration: 180,
        releaseDate: new Date(),
      } as SongType;

      jest.spyOn(graphqlSongsService, "findOne").mockResolvedValue(mockSong);

      const result = await resolver.findOne("1");
      expect(result).toEqual(mockSong);
      expect(graphqlSongsService.findOne).toHaveBeenCalledWith("1");
    });
  });

  describe("artists", () => {
    it("should resolve artists for a song", async () => {
      const mockSong = {
        id: "1",
        artists: ["artist1", "artist2"],
      };

      const mockArtists = [
        { id: "artist1", name: "Artist 1" },
        { id: "artist2", name: "Artist 2" },
      ];

      jest.spyOn(dataLoadersService.artistLoader, "load")
        .mockResolvedValueOnce(mockArtists[0] as any)
        .mockResolvedValueOnce(mockArtists[1] as any);

      const result = await resolver.artists(mockSong as any);
      expect(result).toEqual(mockArtists);
      expect(dataLoadersService.artistLoader.load).toHaveBeenCalledTimes(2);
    });

    it("should filter out null artists", async () => {
      const mockSong = {
        id: "1",
        artists: ["artist1", "artist2"],
      };

      const mockArtists = [
        { id: "artist1", name: "Artist 1" },
        null,
      ];

      jest.spyOn(dataLoadersService.artistLoader, "load")
        .mockResolvedValueOnce(mockArtists[0] as any)
        .mockResolvedValueOnce(null);

      const result = await resolver.artists(mockSong as any);
      expect(result).toEqual([mockArtists[0]]);
    });
  });

  describe("genres", () => {
    it("should resolve genres for a song", async () => {
      const mockSong = {
        id: "1",
        genres: ["genre1", "genre2"],
      };

      const mockGenres = [
        { id: "genre1", name: "Genre 1" },
        { id: "genre2", name: "Genre 2" },
      ];

      jest.spyOn(dataLoadersService.genreLoader, "load")
        .mockResolvedValueOnce(mockGenres[0] as any)
        .mockResolvedValueOnce(mockGenres[1] as any);

      const result = await resolver.genres(mockSong as any);
      expect(result).toEqual(mockGenres);
    });

    it("should return null if song has no genres", async () => {
      const mockSong = {
        id: "1",
        genres: null,
      };

      const result = await resolver.genres(mockSong as any);
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create a new song", async () => {
      const input = {
        title: "New Song",
        artists: ["artist1"],
        album: "New Album",
        duration: 200,
        releaseDate: new Date(),
      };

      const mockCreatedSong = {
        id: "1",
        ...input,
      } as SongType;

      jest.spyOn(graphqlSongsService, "create").mockResolvedValue(mockCreatedSong);

      const result = await resolver.create(input as any);
      expect(result).toEqual(mockCreatedSong);
    });
  });

  describe("update", () => {
    it("should update a song", async () => {
      const input = {
        title: "Updated Song",
      };

      const mockUpdatedSong = {
        id: "1",
        title: "Updated Song",
        album: "Album",
        duration: 200,
        releaseDate: new Date(),
      } as SongType;

      jest.spyOn(graphqlSongsService, "update").mockResolvedValue(mockUpdatedSong);

      const result = await resolver.update("1", input as any);
      expect(result).toEqual(mockUpdatedSong);
    });
  });

  describe("remove", () => {
    it("should remove a song", async () => {
      jest.spyOn(graphqlSongsService, "remove").mockResolvedValue("1");

      const result = await resolver.remove("1");
      expect(result).toBe("1");
    });
  });
});
