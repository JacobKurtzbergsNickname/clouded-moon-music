import { Test, TestingModule } from "@nestjs/testing";
import { SongsResolver } from "./songs.resolver";
import { GraphqlSongsService } from "../graphql.service";
import { DataLoadersService } from "../dataloaders/dataloaders.service";
import { SongRawGqlType, SongType } from "../models/song.type";
import { ArtistType } from "../models/artist.type";
import { GenreType } from "../models/genre.type";
import { CreateSongInput, UpdateSongInput } from "../models/song.input";

describe("SongsResolver", () => {
  let resolver: SongsResolver;
  let graphqlSongsService: GraphqlSongsService;
  let dataLoadersService: DataLoadersService;

  beforeEach(async () => {
    const mockGraphqlSongsService = {
      findAll: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };

    const mockDataLoadersService = {
      artistLoader: {
        load: vi.fn(),
      },
      genreLoader: {
        load: vi.fn(),
      },
      albumLoader: {
        load: vi.fn(),
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
      const mockSongs: SongRawGqlType[] = [
        {
          id: "1",
          title: "Test Song",
          album: "Test Album",
          year: 2020,
          duration: 180,
          releaseDate: new Date(),
        } as unknown as SongRawGqlType,
      ];

      vi.spyOn(graphqlSongsService, "findAll").mockResolvedValue(mockSongs);

      const result = await resolver.findAll();
      expect(result).toEqual(mockSongs);
    });
  });

  describe("findOne", () => {
    it("should return a song by id", async () => {
      const mockSong: SongRawGqlType = {
        id: "1",
        title: "Test Song",
        album: "Test Album",
        year: 2020,
        duration: 180,
        releaseDate: new Date(),
      } as unknown as SongRawGqlType;

      vi.spyOn(graphqlSongsService, "findOne").mockResolvedValue(mockSong);

      const result = await resolver.findOne("1");
      expect(result).toEqual(mockSong);
      expect(graphqlSongsService.findOne).toHaveBeenCalledWith("1");
    });
  });

  describe("artists", () => {
    it("should resolve artists for a song", async () => {
      const mockSong: SongRawGqlType = {
        id: "1",
        title: "Test Song",
        duration: 180,
        releaseDate: new Date(),
        artists: ["artist1", "artist2"],
      } as unknown as SongRawGqlType;

      const mockArtists: ArtistType[] = [
        { id: "artist1", name: "Artist 1" },
        { id: "artist2", name: "Artist 2" },
      ];

      vi.spyOn(dataLoadersService.artistLoader, "load")
        .mockResolvedValueOnce(mockArtists[0])
        .mockResolvedValueOnce(mockArtists[1]);

      const result = await resolver.artists(mockSong);
      expect(result).toEqual(mockArtists);
      expect(dataLoadersService.artistLoader.load).toHaveBeenCalledTimes(2);
    });

    it("should filter out null artists", async () => {
      const mockSong: SongRawGqlType = {
        id: "1",
        title: "Test Song",
        duration: 180,
        releaseDate: new Date(),
        artists: ["artist1", "artist2"],
      } as unknown as SongRawGqlType;

      const mockArtists: Array<ArtistType | null> = [
        { id: "artist1", name: "Artist 1" },
        null,
      ];

      vi.spyOn(dataLoadersService.artistLoader, "load")
        .mockResolvedValueOnce(mockArtists[0])
        .mockResolvedValueOnce(null);

      const result = await resolver.artists(mockSong);
      expect(result).toEqual([mockArtists[0]]);
    });
  });

  describe("genres", () => {
    it("should resolve genres for a song", async () => {
      const mockSong: SongRawGqlType = {
        id: "1",
        title: "Test Song",
        duration: 180,
        releaseDate: new Date(),
        genres: ["genre1", "genre2"],
      } as unknown as SongRawGqlType;

      const mockGenres: GenreType[] = [
        { id: "genre1", name: "Genre 1" },
        { id: "genre2", name: "Genre 2" },
      ];

      vi.spyOn(dataLoadersService.genreLoader, "load")
        .mockResolvedValueOnce(mockGenres[0])
        .mockResolvedValueOnce(mockGenres[1]);

      const result = await resolver.genres(mockSong);
      expect(result).toEqual(mockGenres);
    });

    it("should return null if song has no genres", async () => {
      const mockSong: SongRawGqlType = {
        id: "1",
        title: "Test Song",
        duration: 180,
        releaseDate: new Date(),
      } as unknown as SongRawGqlType;

      const result = await resolver.genres(mockSong);
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create a new song", async () => {
      const input: CreateSongInput = {
        title: "New Song",
        artists: ["artist1"],
        album: "New Album",
        duration: 200,
        releaseDate: new Date(),
      };

      const mockCreatedSong: SongRawGqlType = {
        id: "1",
        ...input,
      } as unknown as SongRawGqlType;

      vi.spyOn(graphqlSongsService, "create").mockResolvedValue(
        mockCreatedSong,
      );

      const result = await resolver.create(input);
      expect(result).toEqual(mockCreatedSong);
    });
  });

  describe("update", () => {
    it("should update a song", async () => {
      const input: UpdateSongInput = {
        title: "Updated Song",
      };

      const mockUpdatedSong: SongRawGqlType = {
        id: "1",
        title: "Updated Song",
        album: "Album",
        duration: 200,
        releaseDate: new Date(),
      } as unknown as SongRawGqlType;

      vi.spyOn(graphqlSongsService, "update").mockResolvedValue(
        mockUpdatedSong,
      );

      const result = await resolver.update("1", input);
      expect(result).toEqual(mockUpdatedSong);
    });
  });

  describe("remove", () => {
    it("should remove a song", async () => {
      vi.spyOn(graphqlSongsService, "remove").mockResolvedValue("1");

      const result = await resolver.remove("1");
      expect(result).toBe("1");
    });
  });

  describe("album", () => {
    it("should return legacy album as inline AlbumType without loader hit", async () => {
      const legacySong = {
        id: "1",
        album: "Blood Fire Death",
      } as unknown as SongType;

      const result = await resolver.album(legacySong);

      expect(result).toEqual({
        id: "Blood Fire Death",
        title: "Blood Fire Death",
      });
      expect(dataLoadersService.albumLoader.load).not.toHaveBeenCalled();
    });

    it("should use album loader when album looks like an ID and fallback when missing", async () => {
      const songWithIdAlbum = {
        id: "1",
        album: "42",
      } as unknown as SongType;

      vi.spyOn(dataLoadersService.albumLoader, "load").mockResolvedValueOnce(
        null,
      );

      const result = await resolver.album(songWithIdAlbum);

      expect(dataLoadersService.albumLoader.load).toHaveBeenCalledWith("42");
      expect(result).toEqual({ id: "42", title: "42" });
    });
  });
});
