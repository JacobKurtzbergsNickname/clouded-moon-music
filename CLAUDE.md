# CLAUDE.md — Clouded Moon Music API

A comprehensive guide for AI assistants working with this codebase.

## Project Overview

**Clouded Moon Music API** is a NestJS application with dual REST + GraphQL interfaces. It uses a polyglot persistence strategy (MongoDB + PostgreSQL + Redis) and implements advanced GraphQL optimization achieving ~94% query reduction via database-level batching with DataLoaders.

- **App port:** 3456 (default)
- **Swagger UI:** `GET /api`
- **GraphQL Playground:** `GET /graphql`

---

## Development Setup

### Prerequisites

- Node.js, Docker
- Databases: MongoDB 7, PostgreSQL 16, Redis 7 (all via Docker)

### Quick Start

```bash
# Install dependencies
npm install

# Start databases via Docker, then start app in watch mode
npm run start:w-db

# Or start databases manually, then:
npm run dev
```

### Environment Variables

Create a `.env` file in the project root:

```env
# MongoDB
MONGO_HOST=localhost
MONGO_PORT=27019
MONGO_USER=admin
MONGO_PASS=password
MONGO_DB=clouded-moon-music

# PostgreSQL
PG_HOST=localhost
PG_PORT=5433
PG_USER=postgres
PG_PASS=password
PG_DB=clouded-moon-music

# Redis
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASS=password

PORT=3456
NODE_ENV=development
```

### Docker Services

```bash
docker-compose up -d
```

Services started:
| Service | Port | Purpose |
|---|---|---|
| MongoDB | 27019 | Songs database |
| Mongo Express | 8083 | MongoDB admin UI |
| PostgreSQL | 5433 | Artists/Genres database |
| pgAdmin | 5050 | PostgreSQL admin UI |
| Redis | 6380 | Caching layer |

### Seeding

```bash
npm run seed              # Seed all databases
npm run seed:dry          # Dry run (no writes)
npm run seed:postgres     # PostgreSQL only
npm run seed:mongo        # MongoDB only
npm run seed:clear        # Clear all seed data
```

---

## NPM Scripts

| Script               | Purpose                |
| -------------------- | ---------------------- |
| `npm run dev`        | Start in watch mode    |
| `npm run start:w-db` | Start Docker DBs + app |
| `npm run build`      | Compile TypeScript     |
| `npm run start:prod` | Run compiled output    |
| `npm test`           | Run unit tests         |
| `npm run test:watch` | Tests in watch mode    |
| `npm run test:cov`   | Tests with coverage    |
| `npm run test:e2e`   | End-to-end tests       |
| `npm run lint`       | ESLint with auto-fix   |
| `npm run format`     | Prettier formatting    |

---

## Codebase Architecture

### Directory Structure

```
src/
├── main.ts                     # Bootstrap (port 3456, Swagger, ValidationPipe)
├── app.module.ts               # Root module (MongoDB, GraphQL, PostgreSQL, logging)
├── app.controller.ts
├── app.service.ts
├── songs/                      # Songs feature (MongoDB)
│   ├── songs.module.ts
│   ├── songs.service.ts        # Extends CachedServiceBase
│   ├── songs.controller.ts     # REST endpoints
│   ├── models/
│   │   ├── song.schema.ts      # Mongoose schema
│   │   ├── song.entity.ts      # TypeORM entity
│   │   ├── song.dto.ts
│   │   └── create-song.dto.ts
│   └── repositories/
│       ├── songs.repository.ts         # Interface
│       ├── mongo-songs.repository.ts   # MongoDB impl
│       └── sql-songs.repository.ts     # SQL impl (unused)
├── artists/                    # Artists feature (PostgreSQL)
│   ├── artists.module.ts
│   ├── artists.service.ts      # Extends CachedServiceBase
│   ├── artists.controller.ts
│   ├── models/
│   │   ├── artist.entity.ts    # TypeORM entity
│   │   └── artist.dto.ts
│   └── repositories/
│       ├── artists.repository.ts
│       └── sql-artists.repository.ts
├── genres/                     # Genres feature (PostgreSQL)
│   ├── genres.module.ts
│   ├── genres.service.ts       # Extends CachedServiceBase
│   ├── genres.controller.ts
│   ├── models/
│   │   ├── genre.entity.ts     # TypeORM entity
│   │   └── genre.dto.ts
│   └── repositories/
│       ├── genres.repository.ts
│       └── sql-genres.repository.ts
├── graphql/                    # GraphQL layer
│   ├── graphql.module.ts
│   ├── graphql.service.ts
│   ├── dataloaders/
│   │   ├── dataloaders.service.ts      # Request-scoped, 5 DataLoaders
│   │   └── dataloaders.service.spec.ts
│   ├── models/                         # GraphQL type definitions
│   │   ├── song.type.ts
│   │   ├── song.input.ts
│   │   ├── artist.type.ts
│   │   └── genre.type.ts
│   └── resolvers/
│       ├── songs.resolver.ts
│       ├── artists.resolver.ts
│       └── genres.resolver.ts
├── redis/                      # Redis caching
│   ├── redis.module.ts
│   ├── redis.service.ts        # ioredis wrapper
│   └── redis.constants.ts      # Cache keys and TTLs
├── config/                     # Database configuration
│   ├── mongodb.config.ts
│   ├── postgres.config.ts
│   └── redis.config.ts
└── common/
    ├── cached-service.base.ts  # Abstract base with cache methods
    └── logger/
        ├── logger.service.ts   # CMLogger (Winston wrapper)
        ├── logger.module.ts
        ├── winston.config.ts   # Daily rotating file logs
        └── interfaces/
            └── log.interface.ts
```

### Key Architectural Patterns

#### 1. Repository Pattern

Each domain uses an interface-based repository with database-specific implementations:

```typescript
// Interface
export interface SongsRepository {
  findAll(): Promise<Song[]>;
  findOne(id: string): Promise<Song | null>;
  findByArtistIds(artistIds: string[]): Promise<Map<string, Song[]>>;
  // ...
}

// Token-based DI
{ provide: SONGS_REPOSITORY, useClass: MongoSongsRepository }
```

Always inject via token (e.g., `@Inject(SONGS_REPOSITORY)`), not the concrete class.

#### 2. CachedServiceBase

All services extend `CachedServiceBase` in `src/common/cached-service.base.ts`. It provides:

- `getCached<T>(key)` → `Result<T, Error>`
- `setCached(key, data, ttl)` → `Result<"OK", Error>`
- `invalidateCache(...keys)`
- `invalidateCachePattern(pattern)`

Uses [neverthrow](https://github.com/supermacro/neverthrow) `Result` types — do **not** throw errors in services; use `Result` and handle with `.match()` or `.andThen()`.

#### 3. GraphQL DataLoaders (N+1 Prevention)

`DataLoadersService` in `src/graphql/dataloaders/dataloaders.service.ts` is **request-scoped** (`Scope.REQUEST`) and provides 5 DataLoaders:

| Loader                | Batch Method           | Database   |
| --------------------- | ---------------------- | ---------- |
| `artistLoader`        | `findByIds(ids)`       | PostgreSQL |
| `genreLoader`         | `findByIds(ids)`       | PostgreSQL |
| `songLoader`          | `findOne(id)`          | MongoDB    |
| `songsByArtistLoader` | `findByArtistIds(ids)` | MongoDB    |
| `songsByGenreLoader`  | `findByGenreIds(ids)`  | MongoDB    |

Each batch method issues a **single** `IN`/`$in` query regardless of how many IDs are batched. DataLoaders **must preserve result order** matching input ID order, with `null` for missing entries.

#### 4. Polyglot Persistence

| Data    | Database   | Reason                                  |
| ------- | ---------- | --------------------------------------- |
| Songs   | MongoDB    | Schema flexibility, denormalized arrays |
| Artists | PostgreSQL | Relational integrity, unique names      |
| Genres  | PostgreSQL | Relational integrity, unique names      |
| All     | Redis      | Distributed cache, TTL expiry           |

Artist and genre IDs are stored as **string arrays** in MongoDB song documents. There are no foreign key constraints across databases — referential integrity is enforced at the application layer.

#### 5. Error Handling with neverthrow

```typescript
// In services — use Result types, not exceptions
const result = await this.getCached<Song>(key);
return result.match(
  (cached) => cached,
  async (_err) => {
    const song = await this.repo.findOne(id);
    if (song) await this.setCached(key, song, TTL);
    return song;
  },
);
```

---

## Database Schemas

### MongoDB — Songs

```typescript
{
  _id: ObjectId,
  title: string,           // required
  artists: string[],       // artist IDs (references PostgreSQL artists.id)
  album: string,
  year?: number,
  genres: string[],        // genre IDs (references PostgreSQL genres.id)
  duration: number,        // seconds
  releaseDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### PostgreSQL — Artists

```sql
id    SERIAL PRIMARY KEY
name  VARCHAR UNIQUE NOT NULL
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### PostgreSQL — Genres

```sql
id    SERIAL PRIMARY KEY
name  VARCHAR UNIQUE NOT NULL
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

---

## REST API Endpoints

All song operations via REST:

```
POST   /songs         Create song (201)
GET    /songs         List all songs
GET    /songs/:id     Get single song
PATCH  /songs/:id     Partial update
PUT    /songs/:id     Full replace
DELETE /songs/:id     Delete song
```

Artists and genres are managed via GraphQL mutations only.

Swagger documentation available at `GET /api`.

---

## GraphQL API

### Query Examples

```graphql
# Fetch songs with resolved artist and genre names
query {
  songs {
    id
    title
    artists {
      id
      name
    }
    genres {
      id
      name
    }
  }
}

# Single song
query {
  song(id: "...") {
    title
    album
    year
  }
}

# Artists with their songs
query {
  artists {
    id
    name
    songs {
      title
    }
  }
}
```

### Limits

- **Depth limit:** max 5 levels
- **Complexity limit:** max 1000 points

---

## Caching Strategy

Cache keys are defined in `src/redis/redis.constants.ts`:

| Key Pattern        | TTL  | Invalidated By                     |
| ------------------ | ---- | ---------------------------------- |
| `song:<id>`        | 300s | Song mutations                     |
| `songs:list:all`   | 60s  | Song mutations                     |
| `artist:<id>`      | 600s | Song mutations (if artist changes) |
| `artists:list:all` | 300s | Song mutations                     |
| `genre:<id>`       | 600s | Song mutations (if genre changes)  |
| `genres:list:all`  | 300s | Song mutations                     |

Cache invalidation uses both exact key deletion and pattern-based SCAN for bulk invalidation.

**Important:** Batch methods used by DataLoaders (`findByIds`, `findByArtistIds`, `findByGenreIds`) intentionally **bypass the cache** to let DataLoader batching work optimally.

---

## Testing

Tests live alongside source files as `*.spec.ts`. E2E tests are in `test/`.

```bash
npm test              # Run all unit tests
npm run test:cov      # With coverage report
npm run test:e2e      # End-to-end tests
```

### Test Conventions

- Use `@nestjs/testing` `Test.createTestingModule()` for integration-style tests
- Mock all external dependencies (repositories, Redis, databases) with `vi.fn()`
- Provide mock repository tokens: `{ provide: SONGS_REPOSITORY, useValue: mockRepo }`
- Assert on batch methods (`findByIds`, `findByArtistIds`) to verify DataLoader batching
- Test cache hit paths and cache miss → DB fallback paths separately

### Test Coverage Targets

The project maintains **130 tests across 15 suites** with 100% passing. When adding features, always add corresponding tests.

---

## Logging

Use the injected `CMLogger` (not `console.log`):

```typescript
constructor(private readonly logger: CMLoggerService) {}

this.logger.log('Message', 'ContextName');
this.logger.error('Error message', error.stack, 'ContextName');
this.logger.warn('Warning', 'ContextName');
```

Log files rotate daily:

- `logs/error.log` — error level only
- `logs/combined.log` — all levels

---

## Code Style & Conventions

### TypeScript

- **Strict mode** enabled — no implicit `any`
- Use interfaces for repository contracts, classes for implementations
- Prefer `readonly` properties in constructors
- All public service methods should be `async` and return `Promise<T | null>` or neverthrow `Result`

### NestJS Conventions

- Feature modules live under `src/<feature>/`
- Module file: `<feature>.module.ts`
- Service file: `<feature>.service.ts`
- Controller file: `<feature>.controller.ts`
- Repository interface: `repositories/<feature>.repository.ts`
- DB implementation: `repositories/<db>-<feature>.repository.ts`

### Formatting

Prettier is configured with:

- Print width: 80
- Tab width: 2, spaces (no tabs)
- Semicolons: on
- Quotes: double
- Trailing commas: all
- Line endings: LF

Run `npm run format` and `npm run lint` before committing.

### Adding a New Domain Module

1. Create `src/<domain>/` directory with module, service, controller
2. Create `models/` with DTOs and entity/schema
3. Create `repositories/` with interface and implementation
4. Extend `CachedServiceBase` in the service
5. Register a DataLoader in `dataloaders.service.ts` if needed
6. Add GraphQL type, input, and resolver in `src/graphql/`
7. Add cache key constants in `redis.constants.ts`
8. Import the new module in `app.module.ts`
9. Write unit tests for service, controller, repository, and resolver

---

## GraphQL Optimization Notes

When adding new GraphQL field resolvers that load related data:

1. **Always use a DataLoader** — never call service methods directly in `@ResolveField`
2. **Add a batch method** to the service/repository (e.g., `findByIds(ids: number[])`)
3. Batch method must **return results in the same order** as input IDs
4. Batch method must return `null` for IDs that don't exist
5. Register a new DataLoader in `DataLoadersService` using the batch method
6. Inject `DataLoadersService` into the resolver

This ensures a single DB query per request regardless of how many records are fetched.

---

## MCP Server Integration

See `MCP-SETUP.md` for configuring:

- **MongoDB MCP Server** — for database queries from AI tools
- **Context7** — for library documentation lookups
- **Postman MCP** — for API testing workflows

---

## Documentation

- `README.md` — User-facing setup and usage guide
- `docs/database-level-batching-implementation.md` — DataLoader + batch query details
- `docs/graphql-filtering-pagination.md` — Future filtering/pagination roadmap
- `docs/graphql-mongo-setup.md` — MongoDB + GraphQL integration notes
- `api_requests/song-api.http` — Sample HTTP requests (VS Code REST Client)
