# Implementation PRD Context

_Source basis: `docs/database-level-batching-implementation.md`._

## Problem Statement

The GraphQL layer previously used DataLoader to batch requests in memory, but the repository layer still executed one database query per entity lookup. This left the API vulnerable to N+1 behavior under nested GraphQL access patterns.

## Implemented Solution Summary

### Database-level batching
- Added repository batch methods for artists and genres using SQL `IN (...)` queries.
- Added repository batch methods for songs using MongoDB `$in` queries.
- Updated service methods to expose batch-oriented read APIs.
- Updated DataLoader batch functions to call repository-backed batch methods instead of issuing repeated single-record queries.

### Expected Performance Impact
- Prior behavior: 1 song query + many artist/genre queries.
- Current behavior: 1 song query + 1 batch artist query + 1 batch genre query for the same request shape.
- Documented reduction: from 51 database queries to 3 for the example GraphQL query.

## Design Constraints

- Preserve DataLoader response ordering.
- Return `null` placeholders for missing IDs in the correct positions.
- Handle empty array inputs without error.
- Prefer repository/service-level batching over in-memory filtering.
- Keep batch operations observable through logging.

## Relevant Existing Surfaces

### Repository layer
- `ArtistsRepository.findByIds(ids: string[])`
- `GenresRepository.findByIds(ids: string[])`
- `SongsRepository.findByArtistIds(artistIds: string[])`
- `SongsRepository.findByGenreIds(genreIds: string[])`

### Service layer
- `ArtistsService.findByIds(ids: string[])`
- `GenresService.findByIds(ids: string[])`
- `SongsService.findByArtistIds(artistIds: string[])`
- `SongsService.findByGenreIds(genreIds: string[])`

### GraphQL layer
- Request-scoped DataLoader implementations should always use the batch service methods rather than `findOne()` loops or `findAll()` plus in-memory filtering.

## Acceptance Signals

- Nested GraphQL relationship reads execute batched DB queries.
- Tests assert that batch service methods are used.
- Performance-sensitive paths avoid `Promise.all(ids.map(findOne))` patterns.
