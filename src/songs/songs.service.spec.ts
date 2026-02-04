import { Test, TestingModule } from "@nestjs/testing";
import { CMLogger } from "src/common/logger";
import { SongsService } from "./songs.service";
import { SONGS_REPOSITORY } from "./repositories/songs.repository";

describe("SongsService", () => {
  let service: SongsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SongsService,
        {
          provide: SONGS_REPOSITORY,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            replace: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: CMLogger,
          useValue: {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            verbose: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SongsService>(SongsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
