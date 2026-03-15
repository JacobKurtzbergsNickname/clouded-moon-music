import { Test, TestingModule } from "@nestjs/testing";
import { ArtistsResolver } from "./artists.resolver";
import { GraphqlArtistsService } from "../graphql.service";
import { DataLoadersService } from "../dataloaders/dataloaders.service";
import { ArtistType } from "../models/artist.type";
import { SongType } from "../models/song.type";

describe("ArtistsResolver", () => {
  let resolver: ArtistsResolver;
  let graphqlArtistsService: GraphqlArtistsService;
  let dataLoadersService: DataLoadersService;

  const mockArtist: ArtistType = {
    id: "1",
    name: "Test Artist",
    songs: [],
  };

  const mockGraphqlArtistsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  const mockDataLoadersService = {
    songsByArtistLoader: {
      load: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArtistsResolver,
        {
          provide: GraphqlArtistsService,
          useValue: mockGraphqlArtistsService,
        },
        {
          provide: DataLoadersService,
          useValue: mockDataLoadersService,
        },
      ],
    }).compile();

    resolver = module.get<ArtistsResolver>(ArtistsResolver);
    graphqlArtistsService = module.get<GraphqlArtistsService>(
      GraphqlArtistsService,
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
    it("should return all artists", async () => {
      mockGraphqlArtistsService.findAll.mockResolvedValue([mockArtist]);

      const result = await resolver.findAll();

      expect(result).toEqual([mockArtist]);
      expect(graphqlArtistsService.findAll).toHaveBeenCalled();
    });

    it("should return empty array when no artists", async () => {
      mockGraphqlArtistsService.findAll.mockResolvedValue([]);

      const result = await resolver.findAll();

      expect(result).toEqual([]);
    });
  });

  describe("findOne", () => {
    it("should return an artist by id", async () => {
      mockGraphqlArtistsService.findOne.mockResolvedValue(mockArtist);

      const result = await resolver.findOne("1");

      expect(result).toEqual(mockArtist);
      expect(graphqlArtistsService.findOne).toHaveBeenCalledWith("1");
    });

    it("should return null when artist not found", async () => {
      mockGraphqlArtistsService.findOne.mockResolvedValue(null);

      const result = await resolver.findOne("999");

      expect(result).toBeNull();
    });
  });

  describe("songs", () => {
    it("should resolve songs for an artist using DataLoader", async () => {
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

      mockDataLoadersService.songsByArtistLoader.load.mockResolvedValue(
        mockSongs,
      );

      const result = await resolver.songs({ id: "1" });

      expect(result).toEqual(mockSongs);
      expect(dataLoadersService.songsByArtistLoader.load).toHaveBeenCalledWith(
        "1",
      );
    });

    it("should return empty array when artist has no songs", async () => {
      mockDataLoadersService.songsByArtistLoader.load.mockResolvedValue([]);

      const result = await resolver.songs({ id: "1" });

      expect(result).toEqual([]);
    });
  });
});
