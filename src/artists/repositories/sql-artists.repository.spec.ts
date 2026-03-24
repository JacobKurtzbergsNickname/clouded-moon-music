import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SqlArtistsRepository } from "./sql-artists.repository";
import { Artist } from "../models/artist.entity";
import { Song } from "../../songs/models/song.entity";

describe("SqlArtistsRepository", () => {
  let repository: SqlArtistsRepository;
  let artistRepository: Repository<Artist>;

  const mockArtist: Artist = {
    id: 1,
    name: "Test Artist",
    songs: [
      { id: 1, title: "Song 1" } as unknown as Song,
      { id: 2, title: "Song 2" } as unknown as Song,
    ],
  };

  const mockArtistRepository = {
    find: vi.fn(),
    findOne: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SqlArtistsRepository,
        {
          provide: getRepositoryToken(Artist),
          useValue: mockArtistRepository,
        },
      ],
    }).compile();

    repository = module.get<SqlArtistsRepository>(SqlArtistsRepository);
    artistRepository = module.get<Repository<Artist>>(
      getRepositoryToken(Artist),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });

  describe("findAll", () => {
    it("should return an array of artist DTOs", async () => {
      const mockArtists = [mockArtist];
      mockArtistRepository.find.mockResolvedValue(mockArtists);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "1",
        name: "Test Artist",
        songs: ["Song 1", "Song 2"],
      });
      expect(artistRepository.find).toHaveBeenCalledWith({
        relations: ["songs"],
      });
    });

    it("should return an empty array when no artists exist", async () => {
      mockArtistRepository.find.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
      expect(artistRepository.find).toHaveBeenCalledWith({
        relations: ["songs"],
      });
    });

    it("should handle artists with no songs", async () => {
      const artistWithoutSongs = { ...mockArtist, songs: [] };
      mockArtistRepository.find.mockResolvedValue([artistWithoutSongs]);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].songs).toEqual([]);
    });

    it("should handle database errors", async () => {
      mockArtistRepository.find.mockRejectedValue(new Error("Database error"));

      await expect(repository.findAll()).rejects.toThrow("Database error");
    });
  });

  describe("findByIds", () => {
    it("should return empty array when ids is empty", async () => {
      const result = await repository.findByIds([]);

      expect(result).toEqual([]);
      expect(artistRepository.find).not.toHaveBeenCalled();
    });

    it("should return array of artist DTOs for valid ids", async () => {
      const mockArtists = [mockArtist];
      mockArtistRepository.find.mockResolvedValue(mockArtists);

      const result = await repository.findByIds(["1"]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "1",
        name: "Test Artist",
        songs: ["Song 1", "Song 2"],
      });
    });

    it("should return null for non-numeric ids", async () => {
      const result = await repository.findByIds(["invalid", "abc"]);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeNull();
      expect(result[1]).toBeNull();
      expect(artistRepository.find).not.toHaveBeenCalled();
    });

    it("should return null for ids not found in database", async () => {
      mockArtistRepository.find.mockResolvedValue([]);

      const result = await repository.findByIds(["999"]);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeNull();
    });

    it("should return results in the same order as input ids", async () => {
      const artist1 = { ...mockArtist, id: 1, name: "Artist 1" };
      const artist2 = { ...mockArtist, id: 2, name: "Artist 2" };
      mockArtistRepository.find.mockResolvedValue([artist2, artist1]);

      const result = await repository.findByIds(["1", "2"]);

      expect(result[0]!.name).toBe("Artist 1");
      expect(result[1]!.name).toBe("Artist 2");
    });
  });

  describe("findOne", () => {
    it("should return an artist DTO by id", async () => {
      mockArtistRepository.findOne.mockResolvedValue(mockArtist);

      const result = await repository.findOne("1");

      expect(result).toEqual({
        id: "1",
        name: "Test Artist",
        songs: ["Song 1", "Song 2"],
      });
      expect(artistRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ["songs"],
      });
    });

    it("should return null if artist not found", async () => {
      mockArtistRepository.findOne.mockResolvedValue(null);

      const result = await repository.findOne("999");

      expect(result).toBeNull();
    });

    it("should return null for invalid ID format", async () => {
      const result = await repository.findOne("invalid-id");

      expect(result).toBeNull();
      expect(artistRepository.findOne).not.toHaveBeenCalled();
    });

    it("should return null for non-numeric ID", async () => {
      const result = await repository.findOne("abc");

      expect(result).toBeNull();
      expect(artistRepository.findOne).not.toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      mockArtistRepository.findOne.mockRejectedValue(
        new Error("Database error"),
      );

      await expect(repository.findOne("1")).rejects.toThrow("Database error");
    });

    it("should handle artists with null songs relation", async () => {
      const artistWithNullSongs = {
        ...mockArtist,
        songs: null as unknown as Song[],
      };
      mockArtistRepository.findOne.mockResolvedValue(artistWithNullSongs);

      const result = await repository.findOne("1");

      expect(result).toEqual({
        id: "1",
        name: "Test Artist",
        songs: [],
      });
    });
  });
});
