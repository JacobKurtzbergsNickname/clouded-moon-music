import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { GenresController } from "./genres.controller";
import { GenresService } from "./genres.service";
import { GenreDTO } from "./models/genre.dto";

describe("GenresController", () => {
  let controller: GenresController;
  let service: GenresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenresController],
      providers: [
        {
          provide: GenresService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GenresController>(GenresController);
    service = module.get<GenresService>(GenresService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should return an array of genres", async () => {
      const mockGenres: GenreDTO[] = [
        { id: "1", name: "Rock", songs: ["Song 1"] },
        { id: "2", name: "Jazz", songs: ["Song 2"] },
      ];
      jest.spyOn(service, "findAll").mockResolvedValue(mockGenres);

      const result = await controller.findAll();

      expect(result).toEqual(mockGenres);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should return a single genre", async () => {
      const mockGenre: GenreDTO = {
        id: "1",
        name: "Rock",
        songs: ["Song 1"],
      };
      jest.spyOn(service, "findOne").mockResolvedValue(mockGenre);

      const result = await controller.findOne("1");

      expect(result).toEqual(mockGenre);
      expect(service.findOne).toHaveBeenCalledWith("1");
    });

    it("should throw NotFoundException when genre not found", async () => {
      jest.spyOn(service, "findOne").mockResolvedValue(null);

      await expect(controller.findOne("999")).rejects.toThrow(
        NotFoundException,
      );
      expect(service.findOne).toHaveBeenCalledWith("999");
    });
  });
});
