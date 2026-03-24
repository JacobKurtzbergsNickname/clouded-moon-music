# Production Requirements — Clouded Moon Music API

**Status:** Draft
**Date:** 2026-03-19
**Priority order reflects implementation sequence.**

---

## P0 — Critical Security

### AUTH-1: Authentication & Authorization
- Implement JWT-based authentication with access + refresh token strategy
- Protect all mutating endpoints (`POST`, `PATCH`, `PUT`, `DELETE`) and GraphQL mutations
- Add role-based access control: `admin` (full access), `reader` (GET/queries only)
- Read operations (`GET /songs`, GraphQL queries) may remain public or require auth depending on deployment context
- **Acceptance:** Unauthenticated mutation requests return `401`; unauthorized role returns `403`

### AUTH-2: Rate Limiting
- Apply per-IP and per-user throttling using `@nestjs/throttler`
- REST: 100 requests/minute per IP (unauthenticated), 500/minute per authenticated user
- GraphQL: 60 operations/minute per IP
- Return `429 Too Many Requests` with `Retry-After` header on breach
- **Acceptance:** Load test confirms limits are enforced; legitimate traffic is unaffected

### SEC-1: HTTP Security Headers
- Add `helmet` middleware in `main.ts`
- Configure `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`
- **Acceptance:** Security headers present on all responses; verified via curl or browser devtools

### SEC-2: CORS Policy
- Explicitly configure allowed origins (env var `CORS_ORIGINS`), methods, and headers
- Block all origins not on the allowlist in production
- **Acceptance:** Cross-origin requests from unlisted origins return `403`

### SEC-3: Remove Hardcoded Credentials
- Remove all default credential strings from `postgres.config.ts`, `mongodb.config.ts`, `redis.config.ts`
- All secrets sourced exclusively from environment variables with no fallback defaults
- **Acceptance:** App refuses to start if any required credential env var is absent

---

## P0 — Critical Reliability

### ERR-1: Global Exception Filter
- Implement a `GlobalExceptionFilter` that catches all unhandled exceptions
- Normalize all error responses to: `{ error: { code, message, requestId } }`
- Map domain errors (`NotFoundException`, `ConflictException`, etc.) to correct HTTP status codes
- Never expose stack traces or internal details to clients
- **Acceptance:** All error paths return consistent shape; no raw stack traces in responses

### SHUT-1: Graceful Shutdown
- Register `SIGTERM` and `SIGINT` handlers in `main.ts`
- Drain in-flight HTTP requests before closing (use `app.close()` with connection draining)
- Close database connections and Redis client cleanly on shutdown
- **Acceptance:** Deploying a new version under load results in zero dropped requests

---

## P1 — Operational Essentials

### OBS-1: Health Check Endpoints
- Add `@nestjs/terminus` health module
- `GET /health/live` — liveness probe (returns `200` if process is running)
- `GET /health/ready` — readiness probe (checks MongoDB, PostgreSQL, Redis connectivity)
- **Acceptance:** Kubernetes or Docker health checks can target these endpoints

### OBS-2: Structured JSON Logging
- Switch Winston transports to JSON format in production (`NODE_ENV=production`)
- Include fields: `timestamp`, `level`, `message`, `context`, `requestId`, `durationMs`, `statusCode`
- Keep human-readable format for local development
- **Acceptance:** Log output in production is valid JSON, parseable by Datadog/Loki/CloudWatch

### OBS-3: Metrics Endpoint
- Integrate `@willsoto/nestjs-prometheus` (or equivalent)
- Expose `GET /metrics` in Prometheus text format
- Track: HTTP request count/latency by route+method+status, cache hit/miss rate, DB query duration
- **Acceptance:** Prometheus can scrape `/metrics`; Grafana dashboard shows request throughput

### CFG-1: Environment Variable Validation
- Add a `joi` or `zod` schema that validates all required env vars at startup
- App must fail fast with a clear error message if any required variable is missing or invalid
- Required vars: `MONGO_HOST`, `MONGO_PORT`, `MONGO_USER`, `MONGO_PASS`, `MONGO_DB`, `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASS`, `PG_DB`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASS`, `PORT`, `NODE_ENV`, `JWT_SECRET`, `CORS_ORIGINS`
- **Acceptance:** Starting the app with a missing required var exits with a descriptive error before binding the port

---

## P1 — API Correctness

### API-1: Pagination
- All list endpoints must support cursor or offset pagination
- `GET /songs?limit=20&offset=0` returns `{ data: Song[], total: number, limit: number, offset: number }`
- GraphQL list queries accept `limit: Int` and `offset: Int` arguments
- Default limit: 20; max limit: 100; requests above max are rejected with `400`
- **Acceptance:** `GET /songs` with no params returns at most 20 results; large datasets do not cause OOM

### API-2: API Versioning
- Prefix all REST routes with `/v1/` (e.g., `GET /v1/songs`)
- Update Swagger `basePath` accordingly
- **Acceptance:** Existing routes redirect or are documented as deprecated; `/v1/` routes work correctly

### API-3: Standard Error Response Shape
- All errors across REST and GraphQL follow: `{ error: { code: string, message: string, requestId: string } }`
- HTTP status codes are semantically correct (400 for validation, 404 for not found, 409 for conflict, 500 for unexpected)
- **Acceptance:** API consumer never receives an undocumented error shape

---

## P1 — Database

### DB-1: Disable TypeORM Auto-Synchronize
- Set `synchronize: false` in TypeORM production config immediately
- Generate initial migration from current schema: `typeorm migration:generate`
- Add migration run step to deployment process (`typeorm migration:run`)
- **Acceptance:** Schema changes in production go through migrations only; `synchronize` is never `true` in prod

### DB-2: Query Timeouts
- Set a statement timeout on PostgreSQL connections (e.g., `statement_timeout: 5000`)
- Set `serverSelectionTimeoutMS` and `socketTimeoutMS` on MongoDB connections
- **Acceptance:** Runaway queries are killed after the timeout rather than holding connections indefinitely

---

## P2 — Deployment

### DEPLOY-1: Dockerfile
- Multi-stage Dockerfile: `build` stage compiles TypeScript, `production` stage runs compiled output
- Non-root user in production image
- `.dockerignore` excludes `node_modules`, `dist`, `logs`, `.env`
- **Acceptance:** `docker build` and `docker run` produce a working container with no root processes

### DEPLOY-2: CI/CD Pipeline
- GitHub Actions workflow on push to `master` and PRs:
  - `lint` job: `npm run lint`
  - `test` job: `npm test` with coverage threshold (80% minimum)
  - `build` job: `npm run build`
  - `docker` job: build and push image on merge to `master`
- **Acceptance:** PRs cannot merge if lint, tests, or build fail

### DEPLOY-3: Kubernetes Manifests
- `Deployment` with liveness (`/health/live`) and readiness (`/health/ready`) probes
- `Service` (ClusterIP) and `Ingress` with TLS termination
- `HorizontalPodAutoscaler` scaling on CPU (target 70%)
- `ConfigMap` for non-secret config; `Secret` for credentials
- **Acceptance:** `kubectl apply` brings up a running, healthy deployment

---

## P2 — Observability (Advanced)

### OBS-4: Distributed Tracing
- Integrate OpenTelemetry SDK
- Propagate trace/span IDs through HTTP headers (`traceparent`)
- Instrument MongoDB, PostgreSQL, and Redis calls automatically
- **Acceptance:** A single GraphQL request produces a trace showing DB calls and their durations

### OBS-5: Audit Logging
- Log all mutating operations (create, update, delete) with: `who`, `what`, `when`, `before`, `after`
- Write audit logs to a separate transport/file, not mixed with application logs
- **Acceptance:** Given any data change, the audit log shows who made it and what changed

---

## P3 — Resilience

### RES-1: Circuit Breaker
- Wrap MongoDB and PostgreSQL calls with a circuit breaker (e.g., `opossum`)
- Open circuit after 5 consecutive failures; attempt half-open after 30s
- Return cached data or a graceful error when circuit is open
- **Acceptance:** If PostgreSQL goes down, artist/genre endpoints return `503` with a clear message rather than hanging

### RES-2: Retry with Exponential Backoff
- Replace the MongoDB fixed-1s retry with exponential backoff (base 500ms, max 4 retries, jitter)
- Apply same pattern to Redis reconnection
- **Acceptance:** Transient DB blips during restart do not surface as errors to clients

---

## Out of Scope (for now)
- Multi-region deployment
- Data encryption at rest (delegated to cloud provider)
- GDPR/compliance logging
- Content negotiation (XML, CSV)
- HATEOAS links
