import { Test, TestingModule } from "@nestjs/testing";
import { GraphqlSongsService, GraphqlArtistsService, GraphqlGenresService } from "./graphql.service";
import { SongsService } from "../songs/songs.service";
import { ArtistsService } from "../artists/artists.service";
import { GenresService } from "../genres/genres.service";

describe("GraphqlSongsService", () => {
  let service: GraphqlSongsService;
  let songsService: SongsService;

  beforeEach(async () => {
    const mockSongsService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphqlSongsService,
        {
          provide: SongsService,
          useValue: mockSongsService,
        },
      ],
    }).compile();

    service = module.get<GraphqlSongsService>(GraphqlSongsService);
    songsService = module.get<SongsService>(SongsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return all songs", async () => {
      const mockSongs = [
        {
          id: "1",
          title: "Test Song",
          artists: ["artist1"],
          album: "Test Album",
          year: 2020,
          duration: 180,
          releaseDate: new Date(),
          genres: ["genre1"],
        },
      ];

      jest.spyOn(songsService, "findAll").mockResolvedValue(mockSongs as any);

      const result = await service.findAll();
      expect(result).toEqual(mockSongs);
      expect(songsService.findAll).toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should return a song by id", async () => {
      const mockSong = {
        id: "1",
        title: "Test Song",
        artists: ["artist1"],
        album: "Test Album",
        year: 2020,
        duration: 180,
        releaseDate: new Date(),
        genres: ["genre1"],
      };

      jest.spyOn(songsService, "findOne").mockResolvedValue(mockSong as any);

      const result = await service.findOne("1");
      expect(result).toEqual(mockSong);
      expect(songsService.findOne).toHaveBeenCalledWith("1");
    });

    it("should return null if song not found", async () => {
      jest.spyOn(songsService, "findOne").mockResolvedValue(null);

      const result = await service.findOne("999");
      expect(result).toBeNull();
    });
  });
});

describe("GraphqlArtistsService", () => {
  let service: GraphqlArtistsService;
  let artistsService: ArtistsService;

  beforeEach(async () => {
    const mockArtistsService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphqlArtistsService,
        {
          provide: ArtistsService,
          useValue: mockArtistsService,
        },
      ],
    }).compile();

    service = module.get<GraphqlArtistsService>(GraphqlArtistsService);
    artistsService = module.get<ArtistsService>(ArtistsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return all artists with string IDs", async () => {
      const mockArtists = [
        { id: "1", name: "Artist 1" },
        { id: "2", name: "Artist 2" },
      ];

      jest.spyOn(artistsService, "findAll").mockResolvedValue(mockArtists as any);

      const result = await service.findAll();
      expect(result).toEqual([
        { id: "1", name: "Artist 1" },
        { id: "2", name: "Artist 2" },
      ]);
    });
  });

  describe("findOne", () => {
    it("should return an artist by id", async () => {
      const mockArtist = { id: "1", name: "Artist 1" };

      jest.spyOn(artistsService, "findOne").mockResolvedValue(mockArtist as any);

      const result = await service.findOne("1");
      expect(result).toEqual({ id: "1", name: "Artist 1" });
    });

    it("should return null if artist not found", async () => {
      jest.spyOn(artistsService, "findOne").mockResolvedValue(null);

      const result = await service.findOne("999");
      expect(result).toBeNull();
    });
  });
});

describe("GraphqlGenresService", () => {
  let service: GraphqlGenresService;
  let genresService: GenresService;

  beforeEach(async () => {
    const mockGenresService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphqlGenresService,
        {
          provide: GenresService,
          useValue: mockGenresService,
        },
      ],
    }).compile();

    service = module.get<GraphqlGenresService>(GraphqlGenresService);
    genresService = module.get<GenresService>(GenresService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return all genres with string IDs", async () => {
      const mockGenres = [
        { id: "1", name: "Genre 1" },
        { id: "2", name: "Genre 2" },
      ];

      jest.spyOn(genresService, "findAll").mockResolvedValue(mockGenres as any);

      const result = await service.findAll();
      expect(result).toEqual([
        { id: "1", name: "Genre 1" },
        { id: "2", name: "Genre 2" },
      ]);
    });
  });

  describe("findOne", () => {
    it("should return a genre by id", async () => {
      const mockGenre = { id: "1", name: "Genre 1" };

      jest.spyOn(genresService, "findOne").mockResolvedValue(mockGenre as any);

      const result = await service.findOne("1");
      expect(result).toEqual({ id: "1", name: "Genre 1" });
    });

    it("should return null if genre not found", async () => {
      jest.spyOn(genresService, "findOne").mockResolvedValue(null);

      const result = await service.findOne("999");
      expect(result).toBeNull();
    });
  });
});
