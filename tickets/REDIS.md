# Redis Structure Overview

## What changed

- Added a Redis module and service that provide a shared Redis client and small helper methods.
- Added a Redis configuration helper that maps environment variables to client options.
- Wired the Redis module into the main application module so it is available for injection.

## Environment variables

Configure the Redis client with the following variables:

- `REDIS_HOST` (default: `localhost`)
- `REDIS_PORT` (default: `6379`)
- `REDIS_PASSWORD` (optional)
- `REDIS_DB` (optional database index)
- `REDIS_TLS` (`true` to enable TLS, otherwise disabled)

## Usage areas

- **Caching** ✓ *Implemented*: Song queries (`findAll`, `findOne`) are cached with automatic invalidation on mutations (`create`, `update`, `replace`, `remove`). Cache keys and TTL values are defined in `redis.constants.ts`.

## Potential usage areas (not yet implemented)

- **Rate limiting**: Store request counters to implement per-user or per-IP rate limits.
- **Background jobs**: Use Redis-backed job queues for processing audio tasks or notifications.
- **Pub/Sub**: Broadcast events when songs are added or updated.
- **Sessions & auth**: Store session tokens or short-lived auth data.
- **Distributed locks**: Prevent duplicate processing for shared resources.

## Next steps to enable real usage

- Ensure the Redis server is available in the target environment.
- Install dependencies (`npm install`) and configure the environment variables above.
- Inject `RedisService` where needed and use `get`, `set`, and `del` helpers or access the client directly.
