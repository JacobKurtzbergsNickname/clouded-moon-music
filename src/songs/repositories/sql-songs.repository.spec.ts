import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SqlSongsRepository } from "./sql-songs.repository";
import { Song } from "../models/song.entity";
import { Artist } from "../../artists/models/artist.entity";
import { Genre } from "../../genres/models/genre.entity";
import CreateSongDTO from "../models/create-song.dto";

describe("SqlSongsRepository", () => {
  let repository: SqlSongsRepository;
  let songRepository: Repository<Song>;
  let artistRepository: Repository<Artist>;
  let genreRepository: Repository<Genre>;

  const mockArtist: Artist = { id: 1, name: "Test Artist", songs: [] };
  const mockGenre: Genre = { id: 1, name: "Rock", songs: [] };
  const mockSong = {
    id: 1,
    title: "Test Song",
    album: "Test Album",
    year: 2024,
    duration: 225,
    releaseDate: new Date("2024-01-01"),
    artists: [mockArtist],
    genres: [mockGenre],
  } as unknown as Song;

  const mockSongRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockArtistRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockGenreRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SqlSongsRepository,
        {
          provide: getRepositoryToken(Song),
          useValue: mockSongRepository,
        },
        {
          provide: getRepositoryToken(Artist),
          useValue: mockArtistRepository,
        },
        {
          provide: getRepositoryToken(Genre),
          useValue: mockGenreRepository,
        },
      ],
    }).compile();

    repository = module.get<SqlSongsRepository>(SqlSongsRepository);
    songRepository = module.get<Repository<Song>>(getRepositoryToken(Song));
    artistRepository = module.get<Repository<Artist>>(
      getRepositoryToken(Artist),
    );
    genreRepository = module.get<Repository<Genre>>(getRepositoryToken(Genre));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });

  describe("findAll", () => {
    it("should return all songs as DTOs", async () => {
      mockSongRepository.find.mockResolvedValue([mockSong]);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "1",
        title: "Test Song",
        album: "Test Album",
        year: 2024,
        duration: 225,
        releaseDate: mockSong.releaseDate,
        artists: ["Test Artist"],
        genres: ["Rock"],
      });
      expect(songRepository.find).toHaveBeenCalledWith({
        relations: ["artists", "genres"],
      });
    });

    it("should return empty array when no songs", async () => {
      mockSongRepository.find.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe("findOne", () => {
    it("should return a song DTO by id", async () => {
      mockSongRepository.findOne.mockResolvedValue(mockSong);

      const result = await repository.findOne("1");

      expect(result).toEqual({
        id: "1",
        title: "Test Song",
        album: "Test Album",
        year: 2024,
        duration: 225,
        releaseDate: mockSong.releaseDate,
        artists: ["Test Artist"],
        genres: ["Rock"],
      });
      expect(songRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ["artists", "genres"],
      });
    });

    it("should return null when song not found", async () => {
      mockSongRepository.findOne.mockResolvedValue(null);

      const result = await repository.findOne("999");

      expect(result).toBeNull();
    });

    it("should return null for invalid (non-numeric) id", async () => {
      const result = await repository.findOne("invalid-id");

      expect(result).toBeNull();
      expect(songRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe("create", () => {
    const createDto: CreateSongDTO = {
      title: "New Song",
      artists: ["Test Artist"],
      album: "New Album",
      year: 2024,
      genres: ["Rock"],
      duration: 180,
      releaseDate: new Date("2024-01-01"),
    };

    it("should create a song with existing artist and genre", async () => {
      mockArtistRepository.findOne.mockResolvedValue(mockArtist);
      mockGenreRepository.findOne.mockResolvedValue(mockGenre);
      mockSongRepository.create.mockReturnValue(mockSong);
      mockSongRepository.save.mockResolvedValue(mockSong);

      const result = await repository.create(createDto);

      expect(result!.title).toBe("Test Song");
      expect(artistRepository.findOne).toHaveBeenCalled();
      expect(genreRepository.findOne).toHaveBeenCalled();
      expect(songRepository.save).toHaveBeenCalled();
    });

    it("should create artist if not found", async () => {
      const newArtist = { id: 2, name: "New Artist", songs: [] };
      mockArtistRepository.findOne.mockResolvedValue(null);
      mockArtistRepository.create.mockReturnValue(newArtist);
      mockArtistRepository.save.mockResolvedValue(newArtist);
      mockGenreRepository.findOne.mockResolvedValue(mockGenre);
      mockSongRepository.create.mockReturnValue(mockSong);
      mockSongRepository.save.mockResolvedValue(mockSong);

      await repository.create(createDto);

      expect(artistRepository.create).toHaveBeenCalledWith({
        name: "Test Artist",
      });
      expect(artistRepository.save).toHaveBeenCalled();
    });

    it("should create genre if not found", async () => {
      const newGenre = { id: 2, name: "Pop", songs: [] };
      mockArtistRepository.findOne.mockResolvedValue(mockArtist);
      mockGenreRepository.findOne.mockResolvedValue(null);
      mockGenreRepository.create.mockReturnValue(newGenre);
      mockGenreRepository.save.mockResolvedValue(newGenre);
      mockSongRepository.create.mockReturnValue(mockSong);
      mockSongRepository.save.mockResolvedValue(mockSong);

      await repository.create(createDto);

      expect(genreRepository.create).toHaveBeenCalledWith({ name: "Rock" });
      expect(genreRepository.save).toHaveBeenCalled();
    });

    it("should handle song with no genres", async () => {
      const dtoWithoutGenres = { ...createDto, genres: undefined };
      mockArtistRepository.findOne.mockResolvedValue(mockArtist);
      mockSongRepository.create.mockReturnValue(mockSong);
      mockSongRepository.save.mockResolvedValue(mockSong);

      await repository.create(dtoWithoutGenres as unknown as CreateSongDTO);

      expect(genreRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should update a song", async () => {
      const updatedSong = { ...mockSong, title: "Updated Song" };
      mockSongRepository.findOne.mockResolvedValue({ ...mockSong });
      mockSongRepository.save.mockResolvedValue(updatedSong);

      const result = await repository.update("1", { title: "Updated Song" });

      expect(result!.title).toBe("Updated Song");
    });

    it("should return null for non-existent song", async () => {
      mockSongRepository.findOne.mockResolvedValue(null);

      const result = await repository.update("999", { title: "Updated" });

      expect(result).toBeNull();
    });

    it("should return null for invalid id", async () => {
      const result = await repository.update("not-a-number", {
        title: "Updated",
      });

      expect(result).toBeNull();
      expect(songRepository.findOne).not.toHaveBeenCalled();
    });

    it("should update artists when provided", async () => {
      const songToUpdate = {
        ...mockSong,
        artists: [mockArtist],
        genres: [mockGenre],
      };
      mockSongRepository.findOne.mockResolvedValue(songToUpdate);
      mockArtistRepository.findOne.mockResolvedValue(mockArtist);
      mockSongRepository.save.mockResolvedValue({
        ...songToUpdate,
        artists: [mockArtist],
      });

      await repository.update("1", { artists: ["Test Artist"] });

      expect(artistRepository.findOne).toHaveBeenCalled();
    });

    it("should create artist during update if not found", async () => {
      const songToUpdate = {
        ...mockSong,
        artists: [mockArtist],
        genres: [mockGenre],
      };
      const newArtist = { id: 3, name: "Brand New Artist", songs: [] };
      mockSongRepository.findOne.mockResolvedValue(songToUpdate);
      mockArtistRepository.findOne.mockResolvedValue(null);
      mockArtistRepository.create.mockReturnValue(newArtist);
      mockArtistRepository.save.mockResolvedValue(newArtist);
      mockSongRepository.save.mockResolvedValue({
        ...songToUpdate,
        artists: [newArtist],
      });

      await repository.update("1", { artists: ["Brand New Artist"] });

      expect(artistRepository.create).toHaveBeenCalledWith({
        name: "Brand New Artist",
      });
    });

    it("should update genres when provided", async () => {
      const songToUpdate = {
        ...mockSong,
        artists: [mockArtist],
        genres: [mockGenre],
      };
      mockSongRepository.findOne.mockResolvedValue(songToUpdate);
      mockGenreRepository.findOne.mockResolvedValue(mockGenre);
      mockSongRepository.save.mockResolvedValue({
        ...songToUpdate,
        genres: [mockGenre],
      });

      await repository.update("1", { genres: ["Rock"] });

      expect(genreRepository.findOne).toHaveBeenCalled();
    });

    it("should create genre during update if not found", async () => {
      const songToUpdate = {
        ...mockSong,
        artists: [mockArtist],
        genres: [mockGenre],
      };
      const newGenre = { id: 3, name: "Jazz", songs: [] };
      mockSongRepository.findOne.mockResolvedValue(songToUpdate);
      mockGenreRepository.findOne.mockResolvedValue(null);
      mockGenreRepository.create.mockReturnValue(newGenre);
      mockGenreRepository.save.mockResolvedValue(newGenre);
      mockSongRepository.save.mockResolvedValue({
        ...songToUpdate,
        genres: [newGenre],
      });

      await repository.update("1", { genres: ["Jazz"] });

      expect(genreRepository.create).toHaveBeenCalledWith({ name: "Jazz" });
    });
  });

  describe("replace", () => {
    const replaceDto: CreateSongDTO = {
      title: "Replaced Song",
      artists: ["Test Artist"],
      album: "Replaced Album",
      year: 2025,
      genres: ["Pop"],
      duration: 240,
      releaseDate: new Date("2025-01-01"),
    };

    it("should replace a song", async () => {
      const replacedSong = {
        ...mockSong,
        title: "Replaced Song",
        album: "Replaced Album",
      };
      mockSongRepository.findOne.mockResolvedValue({ ...mockSong });
      mockArtistRepository.findOne.mockResolvedValue(mockArtist);
      mockGenreRepository.findOne.mockResolvedValue({
        id: 2,
        name: "Pop",
        songs: [],
      });
      mockSongRepository.save.mockResolvedValue(replacedSong);

      const result = await repository.replace("1", replaceDto);

      expect(result!.title).toBe("Replaced Song");
      expect(songRepository.save).toHaveBeenCalled();
    });

    it("should return null for non-existent song", async () => {
      mockSongRepository.findOne.mockResolvedValue(null);

      const result = await repository.replace("999", replaceDto);

      expect(result).toBeNull();
    });

    it("should return null for invalid id", async () => {
      const result = await repository.replace("invalid", replaceDto);

      expect(result).toBeNull();
      expect(songRepository.findOne).not.toHaveBeenCalled();
    });

    it("should create artist during replace if not found", async () => {
      const newArtist = { id: 5, name: "New Artist", songs: [] };
      mockSongRepository.findOne.mockResolvedValue({ ...mockSong });
      mockArtistRepository.findOne.mockResolvedValue(null);
      mockArtistRepository.create.mockReturnValue(newArtist);
      mockArtistRepository.save.mockResolvedValue(newArtist);
      mockGenreRepository.findOne.mockResolvedValue({
        id: 2,
        name: "Pop",
        songs: [],
      });
      mockSongRepository.save.mockResolvedValue({ ...mockSong });

      await repository.replace("1", replaceDto);

      expect(artistRepository.create).toHaveBeenCalled();
    });

    it("should create genre during replace if not found", async () => {
      const newGenre = { id: 5, name: "Pop", songs: [] };
      mockSongRepository.findOne.mockResolvedValue({ ...mockSong });
      mockArtistRepository.findOne.mockResolvedValue(mockArtist);
      mockGenreRepository.findOne.mockResolvedValue(null);
      mockGenreRepository.create.mockReturnValue(newGenre);
      mockGenreRepository.save.mockResolvedValue(newGenre);
      mockSongRepository.save.mockResolvedValue({ ...mockSong });

      await repository.replace("1", replaceDto);

      expect(genreRepository.create).toHaveBeenCalled();
    });

    it("should handle replace with no genres", async () => {
      const replaceDtoNoGenres = { ...replaceDto, genres: undefined };
      mockSongRepository.findOne.mockResolvedValue({ ...mockSong });
      mockArtistRepository.findOne.mockResolvedValue(mockArtist);
      mockSongRepository.save.mockResolvedValue({ ...mockSong });

      await repository.replace(
        "1",
        replaceDtoNoGenres as unknown as CreateSongDTO,
      );

      expect(genreRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("should remove a song and return the id", async () => {
      mockSongRepository.findOne.mockResolvedValue(mockSong);
      mockSongRepository.remove.mockResolvedValue(undefined);

      const result = await repository.remove("1");

      expect(result).toBe("1");
      expect(songRepository.remove).toHaveBeenCalledWith(mockSong);
    });

    it("should return null when song not found", async () => {
      mockSongRepository.findOne.mockResolvedValue(null);

      const result = await repository.remove("999");

      expect(result).toBeNull();
    });

    it("should return null for invalid id", async () => {
      const result = await repository.remove("invalid");

      expect(result).toBeNull();
      expect(songRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe("findByArtistIds", () => {
    it("should return empty array when artistIds is empty", async () => {
      const result = await repository.findByArtistIds([]);

      expect(result).toEqual([]);
      expect(songRepository.find).not.toHaveBeenCalled();
    });

    it("should return all songs when artistIds provided", async () => {
      mockSongRepository.find.mockResolvedValue([mockSong]);

      const result = await repository.findByArtistIds(["1"]);

      expect(result).toHaveLength(1);
    });
  });

  describe("findByGenreIds", () => {
    it("should return empty array when genreIds is empty", async () => {
      const result = await repository.findByGenreIds([]);

      expect(result).toEqual([]);
      expect(songRepository.find).not.toHaveBeenCalled();
    });

    it("should return all songs when genreIds provided", async () => {
      mockSongRepository.find.mockResolvedValue([mockSong]);

      const result = await repository.findByGenreIds(["1"]);

      expect(result).toHaveLength(1);
    });
  });
});
