import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { MongoSongsRepository } from "./mongo-songs.repository";
import { Song, SongDocument } from "../models/song.schema";
import CreateSongDTO from "../models/create-song.dto";

// Test constants
const TEST_OBJECT_ID = "507f1f77bcf86cd799439011";
const TEST_SONG_TITLE = "Test Song";
const TEST_ARTIST_NAME = "Test Artist";
const TEST_ALBUM_NAME = "Test Album";
const TEST_YEAR = 2024;
const TEST_GENRE = "Rock";
const TEST_DURATION = "03:45";
const TEST_RELEASE_DATE = "2024-01-01";
const TEST_INVALID_ID = "invalid-id";
const TEST_UPDATED_TITLE = "Updated Title";
const TEST_UPDATED_SHORT = "Updated";

describe("MongoSongsRepository", () => {
  let repository: MongoSongsRepository;
  let songModel: Model<SongDocument>;

  const mockSongDocument = {
    _id: { toString: () => TEST_OBJECT_ID },
    title: TEST_SONG_TITLE,
    artists: [TEST_ARTIST_NAME],
    album: TEST_ALBUM_NAME,
    year: TEST_YEAR,
    genres: [TEST_GENRE],
    duration: TEST_DURATION,
    releaseDate: new Date(TEST_RELEASE_DATE),
  };

  const mockCreateSongDTO: CreateSongDTO = {
    title: TEST_SONG_TITLE,
    artists: [TEST_ARTIST_NAME],
    album: TEST_ALBUM_NAME,
    year: TEST_YEAR,
    genres: [TEST_GENRE],
    // Note: duration is typed as Date in DTO but stored as string in schema
    duration: TEST_DURATION as any,
    releaseDate: new Date(TEST_RELEASE_DATE),
  };

  const mockSongModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MongoSongsRepository,
        {
          provide: getModelToken(Song.name),
          useValue: mockSongModel,
        },
      ],
    }).compile();

    repository = module.get<MongoSongsRepository>(MongoSongsRepository);
    songModel = module.get<Model<SongDocument>>(getModelToken(Song.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });

  describe("findAll", () => {
    it("should return an array of songs", async () => {
      const mockSongs = [mockSongDocument, mockSongDocument];
      mockSongModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSongs),
      });

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(TEST_OBJECT_ID);
      expect(result[0].title).toBe(TEST_SONG_TITLE);
      expect(songModel.find).toHaveBeenCalled();
    });

    it("should return an empty array when no songs exist", async () => {
      mockSongModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findAll();

      expect(result).toEqual([]);
      expect(songModel.find).toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should return a song by id", async () => {
      mockSongModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSongDocument),
      });

      const result = await repository.findOne(TEST_OBJECT_ID);

      expect(result).toBeDefined();
      expect(result!.id).toBe(TEST_OBJECT_ID);
      expect(result!.title).toBe(TEST_SONG_TITLE);
      expect(songModel.findById).toHaveBeenCalledWith(TEST_OBJECT_ID);
    });

    it("should return null when song is not found", async () => {
      mockSongModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.findOne(TEST_OBJECT_ID);

      expect(result).toBeNull();
      expect(songModel.findById).toHaveBeenCalledWith(TEST_OBJECT_ID);
    });

    it("should return null when id is invalid", async () => {
      const result = await repository.findOne(TEST_INVALID_ID);

      expect(result).toBeNull();
      expect(songModel.findById).not.toHaveBeenCalled();
    });
  });

  describe("create", () => {
    it("should create and return a new song", async () => {
      const saveMock = jest.fn().mockResolvedValue(mockSongDocument);

      // Mock the constructor
      (songModel as any) = jest.fn().mockImplementation(() => ({
        save: saveMock,
      }));

      // Directly assign the mock to the repository's private property
      (repository as any).songModel = songModel;

      const result = await repository.create(mockCreateSongDTO);

      expect(saveMock).toHaveBeenCalled();
      expect(result!.id).toBe(TEST_OBJECT_ID);
      expect(result!.title).toBe(TEST_SONG_TITLE);
    });
  });

  describe("update", () => {
    it("should update and return the updated song", async () => {
      const updatedData = { title: TEST_UPDATED_TITLE };
      const updatedSong = { ...mockSongDocument, ...updatedData };

      mockSongModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedSong),
      });

      const result = await repository.update(TEST_OBJECT_ID, updatedData);

      expect(result!.id).toBe(TEST_OBJECT_ID);
      expect(result!.title).toBe(TEST_UPDATED_TITLE);
      expect(songModel.findByIdAndUpdate).toHaveBeenCalledWith(
        TEST_OBJECT_ID,
        updatedData,
        { new: true },
      );
    });

    it("should return null when updating non-existent song", async () => {
      mockSongModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.update(TEST_OBJECT_ID, {
        title: TEST_UPDATED_SHORT,
      });

      expect(result).toBeNull();
    });

    it("should return null when id is invalid", async () => {
      const result = await repository.update(TEST_INVALID_ID, {
        title: TEST_UPDATED_SHORT,
      });

      expect(result).toBeNull();
      expect(songModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe("replace", () => {
    it("should replace and return the replaced song", async () => {
      const replacedSong = { ...mockSongDocument };

      mockSongModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(replacedSong),
      });

      const result = await repository.replace(
        TEST_OBJECT_ID,
        mockCreateSongDTO,
      );

      expect(result!.id).toBe(TEST_OBJECT_ID);
      expect(result!.title).toBe(TEST_SONG_TITLE);
      expect(songModel.findByIdAndUpdate).toHaveBeenCalledWith(
        TEST_OBJECT_ID,
        mockCreateSongDTO,
        { new: true, overwrite: true, runValidators: true },
      );
    });

    it("should return null when replacing non-existent song", async () => {
      mockSongModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.replace(
        TEST_OBJECT_ID,
        mockCreateSongDTO,
      );

      expect(result).toBeNull();
    });

    it("should return null when id is invalid", async () => {
      const result = await repository.replace(
        TEST_INVALID_ID,
        mockCreateSongDTO,
      );

      expect(result).toBeNull();
      expect(songModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("should remove a song and return the id", async () => {
      mockSongModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSongDocument),
      });

      const result = await repository.remove(TEST_OBJECT_ID);

      expect(result).toBe(TEST_OBJECT_ID);
      expect(songModel.findByIdAndDelete).toHaveBeenCalledWith(TEST_OBJECT_ID);
    });

    it("should return null when song to remove is not found", async () => {
      mockSongModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.remove(TEST_OBJECT_ID);

      expect(result).toBeNull();
      expect(songModel.findByIdAndDelete).toHaveBeenCalledWith(TEST_OBJECT_ID);
    });

    it("should return null when id is invalid", async () => {
      const result = await repository.remove(TEST_INVALID_ID);

      expect(result).toBeNull();
      expect(songModel.findByIdAndDelete).not.toHaveBeenCalled();
    });
  });

  describe("findByArtistIds", () => {
    it("should return empty array when artistIds is empty", async () => {
      const result = await repository.findByArtistIds([]);

      expect(result).toEqual([]);
      expect(songModel.find).not.toHaveBeenCalled();
    });

    it("should return songs matching given artist ids", async () => {
      const mockSongs = [mockSongDocument];
      mockSongModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSongs),
      });

      const result = await repository.findByArtistIds([TEST_OBJECT_ID]);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(TEST_OBJECT_ID);
      expect(songModel.find).toHaveBeenCalledWith({
        artists: { $in: [TEST_OBJECT_ID] },
      });
    });

    it("should return empty array when no songs match", async () => {
      mockSongModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findByArtistIds([TEST_OBJECT_ID]);

      expect(result).toEqual([]);
    });
  });

  describe("findByGenreIds", () => {
    it("should return empty array when genreIds is empty", async () => {
      const result = await repository.findByGenreIds([]);

      expect(result).toEqual([]);
      expect(songModel.find).not.toHaveBeenCalled();
    });

    it("should return songs matching given genre ids", async () => {
      const mockSongs = [mockSongDocument];
      mockSongModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSongs),
      });

      const result = await repository.findByGenreIds([TEST_OBJECT_ID]);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(TEST_OBJECT_ID);
      expect(songModel.find).toHaveBeenCalledWith({
        genres: { $in: [TEST_OBJECT_ID] },
      });
    });

    it("should return empty array when no songs match", async () => {
      mockSongModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findByGenreIds([TEST_OBJECT_ID]);

      expect(result).toEqual([]);
    });
  });
});
