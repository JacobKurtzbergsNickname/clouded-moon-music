import { Test, TestingModule } from "@nestjs/testing";
import { GenresResolver } from "./genres.resolver";
import { GraphqlGenresService } from "../graphql.service";
import { DataLoadersService } from "../dataloaders/dataloaders.service";
import { GenreType } from "../models/genre.type";
import { SongType } from "../models/song.type";

describe("GenresResolver", () => {
  let resolver: GenresResolver;
  let graphqlGenresService: GraphqlGenresService;
  let dataLoadersService: DataLoadersService;

  const mockGenre: GenreType = {
    id: "1",
    name: "Rock",
    songs: [],
  };

  const mockGraphqlGenresService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  const mockDataLoadersService = {
    songsByGenreLoader: {
      load: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenresResolver,
        {
          provide: GraphqlGenresService,
          useValue: mockGraphqlGenresService,
        },
        {
          provide: DataLoadersService,
          useValue: mockDataLoadersService,
        },
      ],
    }).compile();

    resolver = module.get<GenresResolver>(GenresResolver);
    graphqlGenresService = module.get<GraphqlGenresService>(
      GraphqlGenresService,
    );
    dataLoadersService = module.get<DataLoadersService>(DataLoadersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(resolver).toBeDefined();
  });

  describe("findAll", () => {
    it("should return all genres", async () => {
      mockGraphqlGenresService.findAll.mockResolvedValue([mockGenre]);

      const result = await resolver.findAll();

      expect(result).toEqual([mockGenre]);
      expect(graphqlGenresService.findAll).toHaveBeenCalled();
    });

    it("should return empty array when no genres", async () => {
      mockGraphqlGenresService.findAll.mockResolvedValue([]);

      const result = await resolver.findAll();

      expect(result).toEqual([]);
    });
  });

  describe("findOne", () => {
    it("should return a genre by id", async () => {
      mockGraphqlGenresService.findOne.mockResolvedValue(mockGenre);

      const result = await resolver.findOne("1");

      expect(result).toEqual(mockGenre);
      expect(graphqlGenresService.findOne).toHaveBeenCalledWith("1");
    });

    it("should return null when genre not found", async () => {
      mockGraphqlGenresService.findOne.mockResolvedValue(null);

      const result = await resolver.findOne("999");

      expect(result).toBeNull();
    });
  });

  describe("songs", () => {
    it("should resolve songs for a genre using DataLoader", async () => {
      const mockSongs: SongType[] = [
        {
          id: "song-1",
          title: "Test Song",
          album: "Test Album",
          year: 2024,
          duration: 180,
          releaseDate: new Date(),
        } as SongType,
      ];

      mockDataLoadersService.songsByGenreLoader.load.mockResolvedValue(
        mockSongs,
      );

      const result = await resolver.songs({ id: "1" });

      expect(result).toEqual(mockSongs);
      expect(dataLoadersService.songsByGenreLoader.load).toHaveBeenCalledWith(
        "1",
      );
    });

    it("should return empty array when genre has no songs", async () => {
      mockDataLoadersService.songsByGenreLoader.load.mockResolvedValue([]);

      const result = await resolver.songs({ id: "1" });

      expect(result).toEqual([]);
    });
  });
});
