/**
 * Comprehensive database seeding script for Clouded Moon Music API
 * Seeds both PostgreSQL (artists, genres, songs with relations) and MongoDB (denormalized songs)
 */

import "dotenv/config";
import { DataSource } from "typeorm";
import mongoose from "mongoose";
import chalk from "chalk";
import { Artist } from "../src/artists/models/artist.entity";
import { Genre } from "../src/genres/models/genre.entity";
import { Song as SQLSong } from "../src/songs/models/song.entity";
import { SongSchema } from "../src/songs/models/song.schema";
import { getPostgresConfig } from "../src/config/postgres.config";
import { getMongoDbUri } from "../src/config/mongodb.config";
import { ARTISTS } from "./seed-data/artists.data";
import { GENRES } from "./seed-data/genres.data";
import { SONGS } from "./seed-data/songs.data";

// Command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const POSTGRES_ONLY = args.includes("--postgres-only");
const MONGO_ONLY = args.includes("--mongo-only");
const CLEAR_ONLY = args.includes("--clear");

// Logger utilities
const log = {
  info: (msg: string) => console.log(chalk.blue("ℹ"), msg),
  success: (msg: string) => console.log(chalk.green("✓"), msg),
  error: (msg: string) => console.log(chalk.red("✗"), msg),
  warn: (msg: string) => console.log(chalk.yellow("⚠"), msg),
  title: (msg: string) =>
    console.log(chalk.bold.cyan(`\n${msg}\n${"=".repeat(msg.length)}`)),
  step: (msg: string) => console.log(chalk.gray("→"), msg),
};

/**
 * Initialize PostgreSQL connection
 */
async function initPostgres(): Promise<DataSource> {
  log.step("Connecting to PostgreSQL...");
  const config = getPostgresConfig(__dirname + "/../src");
  const dataSource = new DataSource(config as any);
  await dataSource.initialize();
  log.success("PostgreSQL connected");
  return dataSource;
}

/**
 * Initialize MongoDB connection
 */
async function initMongo(): Promise<typeof mongoose> {
  log.step("Connecting to MongoDB...");
  const uri = getMongoDbUri();
  await mongoose.connect(uri);
  log.success("MongoDB connected");
  return mongoose;
}

/**
 * Clear PostgreSQL data
 */
async function clearPostgres(dataSource: DataSource): Promise<void> {
  log.title("Clearing PostgreSQL Data");

  const songRepo = dataSource.getRepository(SQLSong);
  const artistRepo = dataSource.getRepository(Artist);
  const genreRepo = dataSource.getRepository(Genre);

  // Get counts before clearing
  const songCount = await songRepo.count();
  const artistCount = await artistRepo.count();
  const genreCount = await genreRepo.count();

  // Use raw SQL to TRUNCATE with CASCADE to handle foreign key constraints
  log.step("Clearing all tables with CASCADE...");
  await dataSource.query(
    "TRUNCATE TABLE songs, song_artists, song_genres, artists, genres RESTART IDENTITY CASCADE",
  );

  log.success(
    `Deleted ${songCount} songs, ${artistCount} artists, ${genreCount} genres`,
  );
}

/**
 * Clear MongoDB data
 */
async function clearMongo(): Promise<void> {
  log.title("Clearing MongoDB Data");

  const SongModel = mongoose.model("Song", SongSchema);
  const count = await SongModel.countDocuments();
  await SongModel.deleteMany({});
  log.success(`Deleted ${count} songs from MongoDB`);
}

/**
 * Seed PostgreSQL genres
 */
async function seedGenres(dataSource: DataSource): Promise<Map<string, Genre>> {
  log.title("Seeding Genres");

  const genreRepo = dataSource.getRepository(Genre);
  const genreMap = new Map<string, Genre>();

  for (const genreData of GENRES) {
    log.step(`Creating genre: ${genreData.name}`);
    const genre = genreRepo.create(genreData);
    const saved = await genreRepo.save(genre);
    genreMap.set(saved.name, saved);
  }

  log.success(`Seeded ${genreMap.size} genres`);
  return genreMap;
}

/**
 * Seed PostgreSQL artists
 */
async function seedArtists(
  dataSource: DataSource,
): Promise<Map<string, Artist>> {
  log.title("Seeding Artists");

  const artistRepo = dataSource.getRepository(Artist);
  const artistMap = new Map<string, Artist>();

  for (const artistData of ARTISTS) {
    log.step(`Creating artist: ${artistData.name}`);
    const artist = artistRepo.create(artistData);
    const saved = await artistRepo.save(artist);
    artistMap.set(saved.name, saved);
  }

  log.success(`Seeded ${artistMap.size} artists`);
  return artistMap;
}

/**
 * Seed PostgreSQL songs with relationships
 */
async function seedSongsPostgres(
  dataSource: DataSource,
  artistMap: Map<string, Artist>,
  genreMap: Map<string, Genre>,
): Promise<void> {
  log.title("Seeding Songs (PostgreSQL)");

  const songRepo = dataSource.getRepository(SQLSong);
  let successCount = 0;
  let errorCount = 0;

  for (const songData of SONGS) {
    try {
      log.step(
        `Creating song: ${songData.title} - ${songData.artists.join(", ")}`,
      );

      // Resolve artists
      const artists = songData.artists
        .map((name) => artistMap.get(name))
        .filter((a): a is Artist => a !== undefined);

      if (artists.length !== songData.artists.length) {
        log.warn(`Some artists not found for: ${songData.title}`);
      }

      // Resolve genres
      const genres = songData.genres
        .map((name) => genreMap.get(name))
        .filter((g): g is Genre => g !== undefined);

      if (genres.length !== songData.genres.length) {
        log.warn(`Some genres not found for: ${songData.title}`);
      }

      // Create song
      const song = songRepo.create({
        title: songData.title,
        album: songData.album,
        year: songData.year,
        duration: songData.duration,
        releaseDate: new Date(songData.releaseDate),
        artists,
        genres,
      });

      await songRepo.save(song);
      successCount++;
    } catch (error) {
      errorCount++;
      const message = error instanceof Error ? error.message : String(error);
      log.error(`Failed to create song: ${songData.title} - ${message}`);
    }
  }

  log.success(`Seeded ${successCount} songs to PostgreSQL`);
  if (errorCount > 0) {
    log.warn(`Failed to seed ${errorCount} songs`);
  }
}

/**
 * Seed MongoDB songs (denormalized)
 */
async function seedSongsMongo(): Promise<void> {
  log.title("Seeding Songs (MongoDB)");

  const SongModel = mongoose.model("Song", SongSchema);
  let successCount = 0;
  let errorCount = 0;

  for (const songData of SONGS) {
    try {
      log.step(
        `Creating song: ${songData.title} - ${songData.artists.join(", ")}`,
      );

      const song = new SongModel({
        title: songData.title,
        artists: songData.artists, // String array
        album: songData.album,
        year: songData.year,
        genres: songData.genres, // String array
        duration: songData.duration,
        releaseDate: new Date(songData.releaseDate),
      });

      await song.save();
      successCount++;
    } catch (error) {
      errorCount++;
      const message = error instanceof Error ? error.message : String(error);
      log.error(`Failed to create song: ${songData.title} - ${message}`);
    }
  }

  log.success(`Seeded ${successCount} songs to MongoDB`);
  if (errorCount > 0) {
    log.warn(`Failed to seed ${errorCount} songs`);
  }
}

/**
 * Verify seeded data
 */
async function verifyData(dataSource: DataSource): Promise<void> {
  log.title("Verification");

  // PostgreSQL counts
  const artistRepo = dataSource.getRepository(Artist);
  const genreRepo = dataSource.getRepository(Genre);
  const songRepo = dataSource.getRepository(SQLSong);

  const artistCount = await artistRepo.count();
  const genreCount = await genreRepo.count();
  const sqlSongCount = await songRepo.count();

  log.info(`PostgreSQL Artists: ${chalk.bold(artistCount)}`);
  log.info(`PostgreSQL Genres: ${chalk.bold(genreCount)}`);
  log.info(`PostgreSQL Songs: ${chalk.bold(sqlSongCount)}`);

  // MongoDB counts
  const SongModel = mongoose.model("Song", SongSchema);
  const mongoSongCount = await SongModel.countDocuments();

  log.info(`MongoDB Songs: ${chalk.bold(mongoSongCount)}`);

  // Warnings
  if (sqlSongCount !== mongoSongCount) {
    log.warn("PostgreSQL and MongoDB song counts don't match!");
  } else {
    log.success("Database counts match!");
  }

  // Sample queries
  log.step("\nSample Queries:");
  const sampleSong = await songRepo.findOne({
    where: {},
    relations: ["artists", "genres"],
  });

  if (sampleSong) {
    console.log(chalk.gray("Sample PostgreSQL Song:"));
    console.log(
      chalk.gray(
        `  "${sampleSong.title}" by ${sampleSong.artists.map((a) => a.name).join(", ")}`,
      ),
    );
    console.log(
      chalk.gray(
        `  Genres: ${sampleSong.genres.map((g) => g.name).join(", ")}`,
      ),
    );
  }

  const sampleMongoSong = await SongModel.findOne();
  if (sampleMongoSong) {
    console.log(chalk.gray("\nSample MongoDB Song:"));
    console.log(
      chalk.gray(
        `  "${sampleMongoSong.title}" by ${sampleMongoSong.artists.join(", ")}`,
      ),
    );
    console.log(chalk.gray(`  Genres: ${sampleMongoSong.genres.join(", ")}`));
  }
}

/**
 * Main seed function
 */
async function main() {
  console.log(
    chalk.bold.magenta("\n🌙 Clouded Moon Music - Database Seeder 🌙\n"),
  );

  if (DRY_RUN) {
    log.warn("DRY RUN MODE - No changes will be made");
    console.log(chalk.gray(`Would seed:`));
    console.log(chalk.gray(`  - ${GENRES.length} genres`));
    console.log(chalk.gray(`  - ${ARTISTS.length} artists`));
    console.log(chalk.gray(`  - ${SONGS.length} songs`));
    return;
  }

  let dataSource: DataSource | null = null;
  let mongoConnection: typeof mongoose | null = null;

  try {
    // Initialize connections
    if (!MONGO_ONLY) {
      dataSource = await initPostgres();
    }
    if (!POSTGRES_ONLY) {
      mongoConnection = await initMongo();
    }

    // Clear existing data
    if (CLEAR_ONLY) {
      if (dataSource) await clearPostgres(dataSource);
      if (mongoConnection) await clearMongo();
      log.success("\nAll data cleared!");
      return;
    }

    // Seed PostgreSQL
    if (dataSource && !MONGO_ONLY) {
      await clearPostgres(dataSource);
      const genreMap = await seedGenres(dataSource);
      const artistMap = await seedArtists(dataSource);
      await seedSongsPostgres(dataSource, artistMap, genreMap);
    }

    // Seed MongoDB
    if (mongoConnection && !POSTGRES_ONLY) {
      await clearMongo();
      await seedSongsMongo();
    }

    // Verify
    if (dataSource && mongoConnection) {
      await verifyData(dataSource);
    }

    log.success("\n✨ Seeding completed successfully! ✨\n");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error(`Seeding failed: ${message}`);
    console.error(error);
    process.exit(1);
  } finally {
    // Cleanup
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
      log.info("PostgreSQL connection closed");
    }
    if (mongoConnection) {
      await mongoose.connection.close();
      log.info("MongoDB connection closed");
    }
  }
}

// Handle errors
process.on("unhandledRejection", (error: Error) => {
  log.error(`Unhandled rejection: ${error.message}`);
  console.error(error);
  process.exit(1);
});

// Run seeder
main();
