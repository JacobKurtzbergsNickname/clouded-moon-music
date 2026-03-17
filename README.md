# Clouded Moon Music API

A production-ready music catalog management system built with NestJS, featuring a hybrid database architecture (MongoDB + PostgreSQL + Redis), dual API interfaces (REST + GraphQL), and advanced performance optimizations.

## 🚀 Features

### Dual API Interfaces

- **REST API** with full CRUD operations and Swagger/OpenAPI documentation
- **GraphQL API** with typed schemas, DataLoader optimization, and query protection

### High-Performance GraphQL

- **94% reduction in database queries** through database-level batching
- Request-scoped DataLoader preventing N+1 query problems
- Single batch queries using SQL `IN` clauses and MongoDB `$in` operators
- Query depth limiting (max 5 levels) and complexity analysis (max 1000 points)

### Hybrid Database Architecture

- **MongoDB** for songs with flexible document storage
- **PostgreSQL** for artists and genres with relational integrity
- **Redis** for distributed caching with TTL-based invalidation
- Automatic connection management and health monitoring

### Advanced Caching

- Cache-aside pattern with Redis for all entity operations
- Configurable TTLs (600s for entities, 300s for lists)
- Automatic cache invalidation on mutations
- Abstract `CachedServiceBase` eliminating 230+ lines of duplicate code

### Production-Ready Features

- Winston logging with daily file rotation
- Comprehensive test suite (130 tests, 15 suites, 100% passing)
- Docker Compose infrastructure with admin UIs
- Request-level middleware logging
- Functional error handling with neverthrow

## 📋 Prerequisites

- **Node.js** 20.x or higher
- **Docker** and Docker Compose
- **npm** or **yarn**

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd clouded-moon-music
npm install
```

### 2. Start Infrastructure with Docker Compose

```bash
docker-compose up -d
```

This starts all required services:

| Service    | Port  | Admin UI                |
| ---------- | ----- | ----------------------- |
| MongoDB    | 27019 | <http://localhost:8083> |
| PostgreSQL | 5433  | <http://localhost:5050> |
| Redis      | 6380  | _(no UI)_               |

> **Default credentials:** `admin` / `PreahChanTravPopookKrap2026`
> PostgreSQL admin login: `admin@cloudedmoon.com`

### 3. Configure Environment Variables

Create a `.env` file in the project root (or use the defaults):

```env
# Application
PORT=3456

# MongoDB
MONGO_URI=mongodb://admin:PreahChanTravPopookKrap2026@localhost:27019/clouded-moon-music?authSource=admin

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_USER=admin
POSTGRES_PASSWORD=PreahChanTravPopookKrap2026
POSTGRES_DATABASE=clouded_moon_music

# Redis
REDIS_HOST=localhost
REDIS_PORT=6380
```

## 🌍 Environment Variables Reference

> When using Docker Compose, these values are pre-configured. Only modify if running databases externally.

| Variable            | Default / Notes           |
| ------------------- | ------------------------- |
| `PORT`              | `3456`                    |
| `MONGO_URI`         | See `.env` example above  |
| `POSTGRES_HOST`     | `localhost`               |
| `POSTGRES_PORT`     | `5433`                    |
| `POSTGRES_USER`     | `admin`                   |
| `POSTGRES_PASSWORD` | _(required)_              |
| `POSTGRES_DATABASE` | `clouded_moon_music`      |
| `REDIS_HOST`        | `localhost`               |
| `REDIS_PORT`        | `6380`                    |

## 🏃 Running the Application

```bash
# Development mode with hot reload
npm run start:dev

# Development with Docker databases
npm run start:w-db

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

The application will be available at:

- **API Server:** <http://localhost:3456>
- **REST API Docs:** <http://localhost:3456/api>
- **GraphQL Playground:** <http://localhost:3456/graphql>

## 📡 API Usage

### REST API

Full Swagger documentation available at <http://localhost:3456/api>

#### Example Requests

See [api_requests/song-api.http](api_requests/song-api.http) for complete examples.

```http
# Get all songs
GET http://localhost:3456/songs

# Create a song
POST http://localhost:3456/songs
Content-Type: application/json

{
  "title": "Hide in Shade",
  "artists": ["Zeal & Ardor"],
  "album": "GREIF",
  "genres": ["Black Metal", "Gospel"],
  "releaseDate": "2021-01-01",
  "duration": 210
}

# Update a song
PATCH http://localhost:3456/songs/{id}

# Delete a song
DELETE http://localhost:3456/songs/{id}
```

### GraphQL API

Access GraphQL Playground at <http://localhost:3456/graphql>

#### Example Queries

**Query songs with nested artists and genres:**

```graphql
query {
  songs {
    id
    title
    album
    duration
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
```

**Query artists with their songs:**

```graphql
query {
  artists {
    id
    name
    songs {
      title
      album
      releaseDate
    }
  }
}
```

**Single entity queries:**

```graphql
query {
  song(id: "507f1f77bcf86cd799439011") {
    title
    artists {
      name
      songs {
        title
      }
    }
  }

  artist(id: "1") {
    name
    songs {
      title
      genres {
        name
      }
    }
  }
}
```

#### GraphQL Performance

The GraphQL API uses **database-level batching** to eliminate N+1 query problems:

- **Before optimization:** 100 artists = 100 separate database queries
- **After optimization:** 100 artists = 1 database query with `IN` clause
- **Result:** Up to 94% reduction in database queries

See [docs/database-level-batching-implementation.md](docs/database-level-batching-implementation.md) for technical details.

## 🏗️ Architecture

<details>
<summary><strong>Module Structure</strong></summary>

```folder
src/
├── songs/           # Song management (MongoDB)
│   ├── songs.controller.ts
│   ├── songs.service.ts
│   ├── songs.module.ts
│   ├── models/
│   └── repositories/
├── artists/         # Artist management (PostgreSQL)
│   ├── artists.service.ts
│   ├── artists.module.ts
│   ├── models/
│   └── repositories/
├── genres/          # Genre management (PostgreSQL)
│   ├── genres.service.ts
│   ├── genres.module.ts
│   ├── models/
│   └── repositories/
├── graphql/         # GraphQL layer
│   ├── resolvers/
│   ├── models/      # GraphQL types
│   ├── dataloaders/ # Request-scoped batching
│   └── graphql.service.ts
├── redis/           # Caching layer
│   └── redis.service.ts
└── common/
    ├── logger/      # Winston logging
    └── middleware/  # Request logging
```

</details>

<details>
<summary><strong>Database Strategy</strong></summary>

#### MongoDB (Songs)

- Flexible schema for music metadata
- Stores artist/genre names as string arrays
- Optimized for read-heavy workloads
- Repository: `MongoSongsRepository` using Mongoose

#### PostgreSQL (Artists & Genres)

- Relational integrity with many-to-many relationships
- TypeORM entities with automatic migrations
- Normalized data structure
- Repositories: `SqlArtistsRepository`, `SqlGenresRepository`

**Why Hybrid?**

- Songs benefit from schema flexibility and embedded data
- Artists/Genres require relational integrity and referential consistency
- Demonstrates polyglot persistence patterns

</details>

<details>
<summary><strong>Caching Layer</strong></summary>

**Redis Implementation:**

- Cache-aside (lazy loading) pattern
- TTL-based expiration (600s entities, 300s lists)
- Automatic invalidation on mutations
- Pattern-based cache clearing

**CachedServiceBase Pattern:**

```typescript
class SongsService extends CachedServiceBase {
  // Automatically inherits:
  // - getCached<T>(key)
  // - setCached(key, value, ttl)
  // - invalidateCache(key)
  // - invalidateCachePattern(pattern)
}
```

</details>

<details>
<summary><strong>GraphQL Optimization</strong></summary>

**DataLoader Integration:**

- Request-scoped instances preventing duplicate fetches
- Batch loading with database-level `IN` clauses
- Maintains order and handles nulls correctly
- 5 DataLoaders: artist, genre, song, songsByArtist, songsByGenre

**Query Protection:**

- Depth limiting (max 5 levels) prevents deeply nested queries
- Complexity analysis (max 1000 points) prevents expensive operations
- Real-time complexity logging for monitoring

</details>

## 🔧 Technical Stack

<details>
<summary><strong>Full stack details</strong></summary>

### Core Framework

- **NestJS 10** - TypeScript framework with dependency injection
- **TypeScript 5.1** - Type safety and modern JavaScript features

### Databases & ORMs

- **MongoDB 7** with **Mongoose 8** - Document storage
- **PostgreSQL 16** with **TypeORM 0.3** - Relational data
- **Redis 7** with **ioredis 5** - Distributed caching

### API & GraphQL

- **@nestjs/swagger 7** - OpenAPI documentation
- **@nestjs/graphql 12** with **Apollo Server** - GraphQL server
- **DataLoader 2** - Request batching and caching
- **graphql-depth-limit** - Query depth protection
- **graphql-query-complexity** - Query cost analysis

### Utilities

- **neverthrow 8** - Functional error handling with Result types
- **class-validator** & **class-transformer** - DTO validation
- **Winston 3** - Structured logging with daily rotation
- **morgan** - HTTP request logging

### Development

- **Jest 29** - Unit and integration testing
- **ESLint** with Airbnb config - Code quality
- **Prettier** - Code formatting
- **Docker Compose** - Local development infrastructure

</details>

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests (130 tests, 15 suites)
npm test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:cov

# E2E tests
npm run test:e2e

# Test PostgreSQL connection
npm run test:pg
```

### Test Coverage

- **130 tests** across 15 test suites
- Repository-level tests for all database operations
- Service-level tests with mocked dependencies
- Controller tests with request/response validation
- GraphQL resolver tests with DataLoader verification
- 100% passing rate

### Key Test Files

- `songs.service.spec.ts` - Caching and CRUD operations
- `sql-artists.repository.spec.ts` - TypeORM batch queries
- `mongo-songs.repository.spec.ts` - MongoDB operations
- `dataloaders.service.spec.ts` - GraphQL batching logic

## 📚 Documentation

Detailed technical documentation available in the `docs/` folder:

### [Database-Level Batching Implementation](docs/database-level-batching-implementation.md)

Complete guide to the GraphQL optimization that achieved 94% query reduction:

- Before/after performance comparison
- Repository batch method implementations
- DataLoader integration details
- Order preservation and null handling

### [GraphQL Filtering and Pagination](docs/graphql-filtering-pagination.md)

Future enhancements roadmap:

- Field-level filtering strategies
- Cursor-based pagination
- Sorting and ordering
- Performance considerations

### [GraphQL MongoDB Setup](docs/graphql-mongo-setup.md)

MongoDB integration specifics:

- Schema design decisions
- Mongoose model configuration
- Query optimization patterns

## 🐛 Troubleshooting

<details>
<summary><strong>Common Issues</strong></summary>

#### Port Conflicts

```bash
# Check if ports are in use
netstat -ano | findstr :3456   # Application
netstat -ano | findstr :27019  # MongoDB
netstat -ano | findstr :5433   # PostgreSQL
netstat -ano | findstr :6380   # Redis

# Stop conflicting services or change ports in docker-compose.yml
```

#### Database Connection Errors

_MongoDB connection failed:_

```bash
# Verify MongoDB is running
docker ps | findstr mongo

# Check logs
docker logs clouded-moon-music-mongo-1

# Test connection
docker exec -it clouded-moon-music-mongo-1 mongosh -u admin -p PreahChanTravPopookKrap2026
```

_PostgreSQL connection failed:_

```bash
# Verify PostgreSQL is running
docker ps | findstr postgres

# Check logs
docker logs clouded-moon-music-postgres-1

# Test connection
npm run test:pg
```

_Redis connection failed:_

```bash
# Verify Redis is running
docker ps | findstr redis

# Check logs
docker logs clouded-moon-music-redis-1

# Test connection
docker exec -it clouded-moon-music-redis-1 redis-cli ping
```

#### Application Won't Start

1. Verify all environment variables are set
2. Check that databases are accessible
3. Review logs in `logs/error.log` and `logs/combined.log`
4. Ensure Node.js version is 20.x or higher

### Admin Interfaces for Debugging

- **Mongo Express:** <http://localhost:8083> - Browse MongoDB collections
- **pgAdmin:** <http://localhost:5050> - Query PostgreSQL tables
- **Swagger UI:** <http://localhost:3456/api> - Test REST endpoints
- **GraphQL Playground:** <http://localhost:3456/graphql> - Test GraphQL queries

### Log Files

Application logs are stored in the `logs/` directory:

- `logs/error.log` - Error-level messages only
- `logs/combined.log` - All log levels
- Automatic daily rotation with timestamps

</details>

## 🚢 Deployment Considerations

<details>
<summary><strong>Production setup notes</strong></summary>

### Environment Security

- Use strong passwords for production databases
- Store credentials in secure secret management (e.g., AWS Secrets Manager)
- Enable SSL/TLS for database connections
- Configure Redis authentication in production

### Docker Production Setup

- Use multi-stage builds to minimize image size
- Configure health checks for all services
- Set up persistent volumes for data retention
- Use Docker secrets instead of environment variables

### Database Coordination

- Ensure MongoDB replica set for high availability
- Configure PostgreSQL connection pooling
- Enable Redis persistence (AOF or RDB)
- Set up regular backup schedules

### Performance Monitoring

- Enable query logging for slow operations
- Monitor Redis memory usage and eviction policies
- Track GraphQL query complexity patterns
- Set up application performance monitoring (APM)

</details>

## 👥 Contributing

### Code Style

- **ESLint** with Airbnb base configuration
- **Prettier** for consistent formatting
- Run `npm run lint` before committing
- Run `npm run format` to auto-format code

### Testing Requirements

- All new features must include unit tests
- Maintain 100% test pass rate
- Add integration tests for API endpoints
- Update test snapshots when schemas change

### Pull Request Process

1. Create a feature branch from `main`
2. Write tests for new functionality
3. Ensure all tests pass (`npm test`)
4. Update documentation as needed
5. Submit PR with clear description of changes

## 📖 Resources

### NestJS Resources

- [NestJS Documentation](https://docs.nestjs.com) - Official framework docs
- [NestJS Discord](https://discord.gg/G7Qnnhy) - Community support
- [NestJS Courses](https://courses.nestjs.com/) - Video tutorials

### Project Resources

- [GraphQL Playground](http://localhost:3456/graphql) - Interactive API exploration
- [Swagger Documentation](http://localhost:3456/api) - REST API reference
- [Winston Logs](logs/) - Application logging output
- [Technical Docs](docs/) - Implementation details and architecture

### Related Technologies

- [MongoDB Documentation](https://docs.mongodb.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [GraphQL Documentation](https://graphql.org/learn/)
- [DataLoader Documentation](https://github.com/graphql/dataloader)

## 📄 License

UNLICENSED - Private project
