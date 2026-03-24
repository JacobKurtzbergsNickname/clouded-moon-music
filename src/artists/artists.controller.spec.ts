import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ArtistsController } from "./artists.controller";
import { ArtistsService } from "./artists.service";
import { ArtistDTO } from "./models/artist.dto";

describe("ArtistsController", () => {
  let controller: ArtistsController;
  let service: ArtistsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArtistsController],
      providers: [
        {
          provide: ArtistsService,
          useValue: {
            findAll: vi.fn(),
            findOne: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ArtistsController>(ArtistsController);
    service = module.get<ArtistsService>(ArtistsService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should return an array of artists", async () => {
      const mockArtists: ArtistDTO[] = [
        { id: "1", name: "Artist 1", songs: ["Song 1"] },
        { id: "2", name: "Artist 2", songs: ["Song 2"] },
      ];
      vi.spyOn(service, "findAll").mockResolvedValue(mockArtists);

      const result = await controller.findAll();

      expect(result).toEqual(mockArtists);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should return a single artist", async () => {
      const mockArtist: ArtistDTO = {
        id: "1",
        name: "Artist 1",
        songs: ["Song 1"],
      };
      vi.spyOn(service, "findOne").mockResolvedValue(mockArtist);

      const result = await controller.findOne("1");

      expect(result).toEqual(mockArtist);
      expect(service.findOne).toHaveBeenCalledWith("1");
    });

    it("should throw NotFoundException when artist not found", async () => {
      vi.spyOn(service, "findOne").mockResolvedValue(null);

      await expect(controller.findOne("999")).rejects.toThrow(
        NotFoundException,
      );
      expect(service.findOne).toHaveBeenCalledWith("999");
    });
  });
});
