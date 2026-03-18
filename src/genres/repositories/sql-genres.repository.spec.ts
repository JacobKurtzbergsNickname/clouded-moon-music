import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SqlGenresRepository } from "./sql-genres.repository";
import { Genre } from "../models/genre.entity";

describe("SqlGenresRepository", () => {
  let repository: SqlGenresRepository;
  let genreRepository: Repository<Genre>;

  const mockGenre: Genre = {
    id: 1,
    name: "Rock",
    songs: [
      { id: 1, title: "Song 1" } as any,
      { id: 2, title: "Song 2" } as any,
    ],
  };

  const mockGenreRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SqlGenresRepository,
        {
          provide: getRepositoryToken(Genre),
          useValue: mockGenreRepository,
        },
      ],
    }).compile();

    repository = module.get<SqlGenresRepository>(SqlGenresRepository);
    genreRepository = module.get<Repository<Genre>>(getRepositoryToken(Genre));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });

  describe("findAll", () => {
    it("should return an array of genre DTOs", async () => {
      const mockGenres = [mockGenre];
      mockGenreRepository.find.mockResolvedValue(mockGenres);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "1",
        name: "Rock",
        songs: ["Song 1", "Song 2"],
      });
      expect(genreRepository.find).toHaveBeenCalledWith({
        relations: ["songs"],
      });
    });

    it("should return an empty array when no genres exist", async () => {
      mockGenreRepository.find.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
      expect(genreRepository.find).toHaveBeenCalledWith({
        relations: ["songs"],
      });
    });

    it("should handle genres with no songs", async () => {
      const genreWithoutSongs = { ...mockGenre, songs: [] };
      mockGenreRepository.find.mockResolvedValue([genreWithoutSongs]);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].songs).toEqual([]);
    });

    it("should handle database errors", async () => {
      mockGenreRepository.find.mockRejectedValue(new Error("Database error"));

      await expect(repository.findAll()).rejects.toThrow("Database error");
    });
  });

  describe("findByIds", () => {
    it("should return empty array when ids is empty", async () => {
      const result = await repository.findByIds([]);

      expect(result).toEqual([]);
      expect(genreRepository.find).not.toHaveBeenCalled();
    });

    it("should return array of genre DTOs for valid ids", async () => {
      const mockGenres = [mockGenre];
      mockGenreRepository.find.mockResolvedValue(mockGenres);

      const result = await repository.findByIds(["1"]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "1",
        name: "Rock",
        songs: ["Song 1", "Song 2"],
      });
    });

    it("should return null for non-numeric ids", async () => {
      const result = await repository.findByIds(["invalid", "abc"]);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeNull();
      expect(result[1]).toBeNull();
      expect(genreRepository.find).not.toHaveBeenCalled();
    });

    it("should return null for ids not found in database", async () => {
      mockGenreRepository.find.mockResolvedValue([]);

      const result = await repository.findByIds(["999"]);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeNull();
    });

    it("should return results in the same order as input ids", async () => {
      const genre1 = { ...mockGenre, id: 1, name: "Rock" };
      const genre2 = { ...mockGenre, id: 2, name: "Pop" };
      mockGenreRepository.find.mockResolvedValue([genre2, genre1]);

      const result = await repository.findByIds(["1", "2"]);

      expect(result[0]!.name).toBe("Rock");
      expect(result[1]!.name).toBe("Pop");
    });
  });

  describe("findOne", () => {
    it("should return a genre DTO by id", async () => {
      mockGenreRepository.findOne.mockResolvedValue(mockGenre);

      const result = await repository.findOne("1");

      expect(result).toEqual({
        id: "1",
        name: "Rock",
        songs: ["Song 1", "Song 2"],
      });
      expect(genreRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ["songs"],
      });
    });

    it("should return null if genre not found", async () => {
      mockGenreRepository.findOne.mockResolvedValue(null);

      const result = await repository.findOne("999");

      expect(result).toBeNull();
    });

    it("should return null for invalid ID format", async () => {
      const result = await repository.findOne("invalid-id");

      expect(result).toBeNull();
      expect(genreRepository.findOne).not.toHaveBeenCalled();
    });

    it("should return null for non-numeric ID", async () => {
      const result = await repository.findOne("abc");

      expect(result).toBeNull();
      expect(genreRepository.findOne).not.toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      mockGenreRepository.findOne.mockRejectedValue(
        new Error("Database error"),
      );

      await expect(repository.findOne("1")).rejects.toThrow("Database error");
    });

    it("should handle genres with null songs relation", async () => {
      const genreWithNullSongs = { ...mockGenre, songs: null as any };
      mockGenreRepository.findOne.mockResolvedValue(genreWithNullSongs);

      const result = await repository.findOne("1");

      expect(result).toEqual({
        id: "1",
        name: "Rock",
        songs: [],
      });
    });
  });
});
