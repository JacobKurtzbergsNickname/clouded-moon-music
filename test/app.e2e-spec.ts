import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "./../src/app.module";

describe("AppController (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("/ (GET)", () => {
    return request(app.getHttpServer())
      .get("/")
      .expect(200)
      .expect("Hello World!");
  });

  it("/songs (GET) returns seeded songs", () => {
    return request(app.getHttpServer())
      .get("/songs")
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveLength(4);
        expect(response.body[0]).toEqual(
          expect.objectContaining({
            id: 0,
            title: "Dickichtgott",
          }),
        );
      });
  });

  it("/songs (POST) creates a song", () => {
    return request(app.getHttpServer())
      .post("/songs")
      .send({
        title: "Vikind",
        artists: ["Eivor"],
        album: "Slor",
        year: 2005,
        genres: ["Nordic"],
        duration: new Date("03:11"),
        releaseDate: new Date("2005-01-01T00:00:00Z"),
      })
      .expect(201)
      .expect((response) => {
        expect(response.body).toEqual(
          expect.objectContaining({
            id: 5,
            title: "Vikind",
          }),
        );
      });
  });

  it("/songs/:id (GET) returns a song", () => {
    return request(app.getHttpServer())
      .get("/songs/1")
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual(
          expect.objectContaining({
            id: 1,
            title: "The Call of the Mountains",
          }),
        );
      });
  });

  it("/songs/:id (GET) returns not found when missing", () => {
    return request(app.getHttpServer())
      .get("/songs/999")
      .expect(200)
      .expect("Not found");
  });

  it("/songs/:id (PATCH) updates a song", () => {
    return request(app.getHttpServer())
      .patch("/songs/1")
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual(
          expect.objectContaining({
            id: 1,
            title: "Helvegen",
          }),
        );
      });
  });

  it("/songs/:id (PUT) replaces a song", () => {
    return request(app.getHttpServer())
      .put("/songs/2")
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual(
          expect.objectContaining({
            id: 2,
            title: "Helvegen",
          }),
        );
      });
  });

  it("/songs/:id (DELETE) removes a song", () => {
    return request(app.getHttpServer())
      .delete("/songs/2")
      .expect(200);
  });

  it("/songs/:id rejects invalid ids", () => {
    return request(app.getHttpServer())
      .get("/songs/not-a-number")
      .expect(406);
  });
});
