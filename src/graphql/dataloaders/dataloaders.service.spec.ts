import { Test, TestingModule } from "@nestjs/testing";
import { DataLoadersService } from "./dataloaders.service";
import { ArtistsService } from "../../artists/artists.service";
import { GenresService } from "../../genres/genres.service";
import { SongsService } from "../../songs/songs.service";
import { ArtistDTO } from "../../artists/models/artist.dto";
import { GenreDTO } from "../../genres/models/genre.dto";
import { SongDTO } from "../../songs/models/song.dto";

describe("DataLoadersService", () => {
  let service: DataLoadersService;
  let artistsService: ArtistsService;
  let genresService: GenresService;
  let songsService: SongsService;

  beforeEach(async () => {
    const mockArtistsService = {
      findByIds: vi.fn(),
    };

    const mockGenresService = {
      findByIds: vi.fn(),
    };

    const mockSongsService = {
      findByIds: vi.fn(),
      findByArtistIds: vi.fn(),
      findByGenreIds: vi.fn(),
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
      const mockArtists: ArtistDTO[] = [
        { id: "1", name: "Artist 1", songs: [] },
        { id: "2", name: "Artist 2", songs: [] },
      ];

      vi.spyOn(artistsService, "findByIds").mockResolvedValue(mockArtists);

      const results = await service.artistLoader.loadMany(["1", "2"]);

      expect(artistsService.findByIds).toHaveBeenCalledWith(["1", "2"]);
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({ id: "1", name: "Artist 1" });
      expect(results[1]).toEqual({ id: "2", name: "Artist 2" });
    });

    it("should return null for non-existent artists", async () => {
      vi.spyOn(artistsService, "findByIds").mockResolvedValue([null]);

      const result = await service.artistLoader.load("999");
      expect(result).toBeNull();
    });
  });

  describe("genreLoader", () => {
    it("should batch load genres", async () => {
      const mockGenres: GenreDTO[] = [
        { id: "1", name: "Genre 1", songs: [] },
        { id: "2", name: "Genre 2", songs: [] },
      ];

      vi.spyOn(genresService, "findByIds").mockResolvedValue(mockGenres);

      const results = await service.genreLoader.loadMany(["1", "2"]);

      expect(genresService.findByIds).toHaveBeenCalledWith(["1", "2"]);
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({ id: "1", name: "Genre 1" });
      expect(results[1]).toEqual({ id: "2", name: "Genre 2" });
    });
  });

  describe("songLoader", () => {
    it("should batch load songs using a single findByIds call", async () => {
      const mockSongs: SongDTO[] = [
        {
          id: "1",
          title: "Song 1",
          artists: ["artist1"],
          album: "Album 1",
          year: 2020,
          duration: 180,
          releaseDate: new Date(),
          genres: ["genre1"],
        },
        {
          id: "2",
          title: "Song 2",
          artists: ["artist2"],
          album: "Album 2",
          year: 2021,
          duration: 200,
          releaseDate: new Date(),
          genres: ["genre2"],
        },
      ];

      vi.spyOn(songsService, "findByIds").mockResolvedValue(
        mockSongs as never[],
      );

      const results = await service.songLoader.loadMany(["1", "2"]);

      // Verify batch method is called instead of individual findOne calls
      expect(songsService.findByIds).toHaveBeenCalledWith(["1", "2"]);
      expect(results).toHaveLength(2);
      expect((results[0] as { id: string }).id).toBe("1");
      expect((results[1] as { id: string }).id).toBe("2");
    });

    it("should return null for non-existent songs", async () => {
      vi.spyOn(songsService, "findByIds").mockResolvedValue([null]);

      const result = await service.songLoader.load("999");
      expect(result).toBeNull();
    });
  });

  describe("songsByArtistLoader", () => {
    it("should load songs for given artists", async () => {
      const mockSongs: SongDTO[] = [
        {
          id: "1",
          title: "Song 1",
          artists: ["artist1"],
          album: "Album 1",
          year: 2020,
          duration: 180,
          releaseDate: new Date(),
          genres: [],
        },
        {
          id: "2",
          title: "Song 2",
          artists: ["artist2"],
          album: "Album 2",
          year: 2021,
          duration: 200,
          releaseDate: new Date(),
          genres: [],
        },
        {
          id: "3",
          title: "Song 3",
          artists: ["artist1"],
          album: "Album 3",
          year: 2022,
          duration: 220,
          releaseDate: new Date(),
          genres: [],
        },
      ];

      vi.spyOn(songsService, "findByArtistIds").mockResolvedValue(mockSongs);

      const results = await service.songsByArtistLoader.loadMany([
        "artist1",
        "artist2",
      ]);

      expect(songsService.findByArtistIds).toHaveBeenCalledWith([
        "artist1",
        "artist2",
      ]);
      expect(results).toHaveLength(2);
      if (!(results[0] instanceof Error)) {
        expect(results[0]).toHaveLength(2); // artist1 has 2 songs
      }
      if (!(results[1] instanceof Error)) {
        expect(results[1]).toHaveLength(1); // artist2 has 1 song
      }
    });
  });

  describe("songsByGenreLoader", () => {
    it("should load songs for given genres", async () => {
      const mockSongs: SongDTO[] = [
        {
          id: "1",
          title: "Song 1",
          artists: ["artist1"],
          album: "Album 1",
          year: 2020,
          duration: 180,
          releaseDate: new Date(),
          genres: ["genre1"],
        },
        {
          id: "2",
          title: "Song 2",
          artists: ["artist2"],
          album: "Album 2",
          year: 2021,
          duration: 200,
          releaseDate: new Date(),
          genres: ["genre2"],
        },
      ];

      vi.spyOn(songsService, "findByGenreIds").mockResolvedValue(mockSongs);

      const results = await service.songsByGenreLoader.loadMany([
        "genre1",
        "genre2",
      ]);

      expect(songsService.findByGenreIds).toHaveBeenCalledWith([
        "genre1",
        "genre2",
      ]);
      expect(results).toHaveLength(2);
      if (!(results[0] instanceof Error)) {
        expect(results[0]).toHaveLength(1); // genre1 has 1 song
      }
      if (!(results[1] instanceof Error)) {
        expect(results[1]).toHaveLength(1); // genre2 has 1 song
      }
    });
  });
});
