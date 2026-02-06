# GraphQL + Mongo (NestJS) Structure

## What Changed

- Added a GraphQL module with a resolver and service that expose the existing
  songs CRUD flows via GraphQL.
- Introduced GraphQL types and inputs that map to existing `SongDTO` data
  shapes, keeping the Mongo repository logic unchanged.
- Wired GraphQL into the application module using Apollo + code-first schema
  generation.

## How It Fits the Current Mongo Structure

- The GraphQL resolver delegates to a dedicated service, which delegates to the
  existing `SongsService`.
- `SongsService` continues to use the Mongo-backed repository registered in the
  `SongsModule`. This keeps Mongo logic untouched while reusing the same
  validation and repository boundaries.

## Potential Redis Integration (Not Implemented)

Redis can be added later without altering the Mongo repository layer:

- **Query caching**: Cache `songs` and `song(id)` query results, with TTLs for
  read-heavy traffic.
- **Mutation invalidation**: Invalidate cached song queries when `createSong`,
  `updateSong`, or `removeSong` mutations succeed.
- **Pub/Sub for subscriptions**: If GraphQL subscriptions are introduced, Redis
  Pub/Sub can be used as a transport to broadcast song changes.
- **Rate limiting**: Apply per-user or per-IP request throttling at the GraphQL
  gateway layer using a Redis-backed store.

## Notes

- The schema is generated at `src/schema.gql` when the server runs in code-first
  mode.
- Any Redis additions should live at the GraphQL gateway or service layer to
  avoid impacting Mongo repository logic.
