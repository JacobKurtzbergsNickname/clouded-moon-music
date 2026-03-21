import { Test, TestingModule } from "@nestjs/testing";
import { DataLoadersService } from "./dataloaders.service";
import { ArtistsService } from "../../artists/artists.service";
import { GenresService } from "../../genres/genres.service";
import { SongsService } from "../../songs/songs.service";
import { PlaylistsService } from "../../playlists/playlists.service";

describe("DataLoadersService", () => {
  let service: DataLoadersService;
  let artistsService: ArtistsService;
  let genresService: GenresService;
  let songsService: SongsService;

  beforeEach(async () => {
    const mockArtistsService = {
      findByIds: jest.fn(),
    };

    const mockGenresService = {
      findByIds: jest.fn(),
    };

    const mockSongsService = {
      findOne: jest.fn(),
      findByArtistIds: jest.fn(),
      findByGenreIds: jest.fn(),
    };

    const mockPlaylistsService = {
      findByIds: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataLoadersService,
        {
          provide: ArtistsService,
          useValue: mockArtistsService,
        },
        {
          provide: GenresService,
          useValue: mockGenresService,
        },
        {
          provide: SongsService,
          useValue: mockSongsService,
        },
        {
          provide: PlaylistsService,
          useValue: mockPlaylistsService,
        },
      ],
    }).compile();

    // Use resolve() instead of get() for request-scoped providers
    service = await module.resolve<DataLoadersService>(DataLoadersService);
    artistsService = module.get<ArtistsService>(ArtistsService);
    genresService = module.get<GenresService>(GenresService);
    songsService = module.get<SongsService>(SongsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("artistLoader", () => {
    it("should batch load artists", async () => {
      const mockArtists = [
        { id: "1", name: "Artist 1" },
        { id: "2", name: "Artist 2" },
      ];

      jest
        .spyOn(artistsService, "findByIds")
        .mockResolvedValue(mockArtists as any);

      const results = await service.artistLoader.loadMany(["1", "2"]);

      expect(artistsService.findByIds).toHaveBeenCalledWith(["1", "2"]);
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({ id: "1", name: "Artist 1" });
      expect(results[1]).toEqual({ id: "2", name: "Artist 2" });
    });

    it("should return null for non-existent artists", async () => {
      jest.spyOn(artistsService, "findByIds").mockResolvedValue([null]);

      const result = await service.artistLoader.load("999");
      expect(result).toBeNull();
    });
  });

  describe("genreLoader", () => {
    it("should batch load genres", async () => {
      const mockGenres = [
        { id: "1", name: "Genre 1" },
        { id: "2", name: "Genre 2" },
      ];

      jest
        .spyOn(genresService, "findByIds")
        .mockResolvedValue(mockGenres as any);

      const results = await service.genreLoader.loadMany(["1", "2"]);

      expect(genresService.findByIds).toHaveBeenCalledWith(["1", "2"]);
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({ id: "1", name: "Genre 1" });
      expect(results[1]).toEqual({ id: "2", name: "Genre 2" });
    });
  });

  describe("songLoader", () => {
    it("should batch load songs", async () => {
      const mockSongs = [
        {
          id: "1",
          title: "Song 1",
          artists: ["artist1"],
          album: "Album 1",
          duration: 180,
          releaseDate: new Date(),
          genres: ["genre1"],
        },
        {
          id: "2",
          title: "Song 2",
          artists: ["artist2"],
          album: "Album 2",
          duration: 200,
          releaseDate: new Date(),
          genres: ["genre2"],
        },
      ];

      jest
        .spyOn(songsService, "findOne")
        .mockResolvedValueOnce(mockSongs[0] as any)
        .mockResolvedValueOnce(mockSongs[1] as any);

      const results = await service.songLoader.loadMany(["1", "2"]);

      expect(results).toHaveLength(2);
    });
  });

  describe("songsByArtistLoader", () => {
    it("should load songs for given artists", async () => {
      const mockSongs = [
        {
          id: "1",
          title: "Song 1",
          artists: ["artist1"],
          album: "Album 1",
          duration: 180,
          releaseDate: new Date(),
          genres: [],
        },
        {
          id: "2",
          title: "Song 2",
          artists: ["artist2"],
          album: "Album 2",
          duration: 200,
          releaseDate: new Date(),
          genres: [],
        },
        {
          id: "3",
          title: "Song 3",
          artists: ["artist1"],
          album: "Album 3",
          duration: 220,
          releaseDate: new Date(),
          genres: [],
        },
      ];

      jest
        .spyOn(songsService, "findByArtistIds")
        .mockResolvedValue(mockSongs as any);

      const results = await service.songsByArtistLoader.loadMany([
        "artist1",
        "artist2",
      ]);

      expect(songsService.findByArtistIds).toHaveBeenCalledWith([
        "artist1",
        "artist2",
      ]);
      expect(results).toHaveLength(2);
      expect((results[0] as any).length).toBe(2); // artist1 has 2 songs
      expect((results[1] as any).length).toBe(1); // artist2 has 1 song
    });
  });

  describe("songsByGenreLoader", () => {
    it("should load songs for given genres", async () => {
      const mockSongs = [
        {
          id: "1",
          title: "Song 1",
          artists: ["artist1"],
          album: "Album 1",
          duration: 180,
          releaseDate: new Date(),
          genres: ["genre1"],
        },
        {
          id: "2",
          title: "Song 2",
          artists: ["artist2"],
          album: "Album 2",
          duration: 200,
          releaseDate: new Date(),
          genres: ["genre2"],
        },
      ];

      jest
        .spyOn(songsService, "findByGenreIds")
        .mockResolvedValue(mockSongs as any);

      const results = await service.songsByGenreLoader.loadMany([
        "genre1",
        "genre2",
      ]);

      expect(songsService.findByGenreIds).toHaveBeenCalledWith([
        "genre1",
        "genre2",
      ]);
      expect(results).toHaveLength(2);
      expect((results[0] as any).length).toBe(1); // genre1 has 1 song
      expect((results[1] as any).length).toBe(1); // genre2 has 1 song
    });
  });
});
