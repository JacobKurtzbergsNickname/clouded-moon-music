import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSongsRepository } from "./mongo-songs.repository";
import { Song, SongDocument } from "../models/song.schema";
import CreateSongDTO from "../models/create-song.dto";

// Mock Types.ObjectId.isValid to accept numeric IDs converted to strings
jest.mock("mongoose", () => {
  const actual = jest.requireActual("mongoose");
  return {
    ...actual,
    Types: {
      ...actual.Types,
      ObjectId: {
        ...actual.Types.ObjectId,
        isValid: jest.fn().mockReturnValue(true),
      },
    },
  };
});

describe("MongoSongsRepository", () => {
  let repository: MongoSongsRepository;
  let songModel: Model<SongDocument>;

  const mockSongDocument = {
    _id: "507f1f77bcf86cd799439011",
    title: "Test Song",
    artists: ["Test Artist"],
    album: "Test Album",
    year: 2024,
    genres: ["Rock"],
    duration: "03:45",
    releaseDate: new Date("2024-01-01"),
  };

  const mockCreateSongDTO: CreateSongDTO = {
    title: "Test Song",
    artists: ["Test Artist"],
    album: "Test Album",
    year: 2024,
    genres: ["Rock"],
    // Note: duration is typed as Date in DTO but stored as string in schema
    duration: "03:45" as any,
    releaseDate: new Date("2024-01-01"),
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
      expect(result[0].id).toBe(507);
      expect(result[0].title).toBe("Test Song");
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

      const result = await repository.findOne(123);

      expect(result).toBeDefined();
      expect(songModel.findById).toHaveBeenCalledWith("123");
    });

    it("should return null when song is not found", async () => {
      mockSongModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.findOne(999);

      expect(result).toBeNull();
      expect(songModel.findById).toHaveBeenCalledWith("999");
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
      expect(result.id).toBe(507);
      expect(result.title).toBe("Test Song");
    });
  });

  describe("update", () => {
    it("should update and return the updated song", async () => {
      const updatedData = { title: "Updated Title" };
      const updatedSong = { ...mockSongDocument, ...updatedData };

      mockSongModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedSong),
      });

      const result = await repository.update(123, updatedData);

      expect(result).toBeDefined();
      expect(result?.title).toBe("Updated Title");
      expect(songModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "123",
        updatedData,
        { new: true },
      );
    });

    it("should return null when updating non-existent song", async () => {
      mockSongModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.update(999, {
        title: "Updated",
      });

      expect(result).toBeNull();
    });
  });

  describe("replace", () => {
    it("should replace and return the replaced song", async () => {
      const replacedSong = { ...mockSongDocument };

      mockSongModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(replacedSong),
      });

      const result = await repository.replace(123, mockCreateSongDTO);

      expect(result).toBeDefined();
      expect(result?.title).toBe("Test Song");
      expect(songModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "123",
        mockCreateSongDTO,
        { new: true, overwrite: true, runValidators: true },
      );
    });

    it("should return null when replacing non-existent song", async () => {
      mockSongModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.replace(
        999,
        mockCreateSongDTO,
      );

      expect(result).toBeNull();
    });
  });

  describe("remove", () => {
    it("should remove a song and return true", async () => {
      mockSongModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSongDocument),
      });

      const result = await repository.remove(123);

      expect(result).toBe(1);
      expect(songModel.findByIdAndDelete).toHaveBeenCalledWith("123");
    });

    it("should return false when song to remove is not found", async () => {
      mockSongModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.remove(999);

      expect(result).toBe(0);
      expect(songModel.findByIdAndDelete).toHaveBeenCalledWith("999");
    });
  });
});
