# Production Requirements Context

_Source basis: `docs/production-requirements.md`._

## Primary Objective

Harden the Clouded Moon Music API for production by addressing security, reliability, observability, API correctness, database safety, deployment readiness, and resilience.

## Priority Map

### P0 — Critical Security
1. JWT authentication and RBAC.
2. REST and GraphQL rate limiting.
3. HTTP security headers via `helmet`.
4. Strict production CORS allowlisting.
5. Removal of hardcoded credential fallbacks.

### P0 — Critical Reliability
1. Global exception normalization.
2. Graceful shutdown for HTTP, DB, and Redis resources.

### P1 — Operational Essentials
1. Liveness and readiness probes.
2. Structured JSON logging in production.
3. Prometheus metrics endpoint.
4. Environment variable validation with fail-fast startup.

### P1 — API Correctness
1. Pagination on list endpoints.
2. `/v1/` REST route versioning.
3. Standardized REST and GraphQL error shapes.

### P1 — Database
1. Disable TypeORM auto-synchronize in production and use migrations.
2. Query timeouts for PostgreSQL and MongoDB.

### P2 — Deployment
1. Multi-stage Dockerfile with non-root runtime.
2. CI/CD workflow for lint, test, build, and Docker publish.
3. Kubernetes manifests with probes, ingress, HPA, config, and secrets.

### P2 — Observability (Advanced)
1. OpenTelemetry distributed tracing.
2. Separate audit logging for mutations.

### P3 — Resilience
1. Circuit breakers for DB access.
2. Retry with exponential backoff for MongoDB and Redis reconnection.

## Cross-cutting Acceptance Requirements

- Error responses should normalize to `{ error: { code, message, requestId } }`.
- Production startup must fail when critical env vars are missing.
- Operational endpoints should support container and orchestrator health checks.
- Deployment assets should be sufficient for containerized and Kubernetes environments.
