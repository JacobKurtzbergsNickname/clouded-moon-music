# Ralph Backlog

## Phase 0 — Baseline and guardrails
- [ ] Confirm current batching implementation still matches the implementation PRD.
- [ ] Add tests that protect against regression to per-record lookup behavior.
- [ ] Inventory current gaps against all production requirements.

## Phase 1 — P0 critical security
- [ ] Implement JWT access and refresh token flows.
- [ ] Protect all mutating REST endpoints and GraphQL mutations.
- [ ] Add role-based access control for `admin` and `reader`.
- [ ] Add REST and GraphQL throttling.
- [ ] Add `helmet` security headers.
- [ ] Enforce allowlisted production CORS.
- [ ] Remove hardcoded DB/Redis credential fallbacks.

## Phase 2 — P0 critical reliability
- [ ] Add a global exception filter that normalizes error payloads.
- [ ] Ensure request IDs are attached and returned in error responses.
- [ ] Implement graceful shutdown for HTTP, PostgreSQL, MongoDB, and Redis.

## Phase 3 — P1 operations and API correctness
- [ ] Add `/health/live` and `/health/ready` endpoints.
- [ ] Switch production logs to structured JSON.
- [ ] Expose `/metrics` in Prometheus format.
- [ ] Add env validation with fail-fast startup.
- [ ] Add pagination to all list endpoints and GraphQL list queries.
- [ ] Add `/v1/` REST versioning.
- [ ] Standardize error responses across REST and GraphQL.
- [ ] Disable TypeORM auto-sync in production and introduce migrations.
- [ ] Configure query timeouts.

## Phase 4 — P2 deployment and advanced observability
- [ ] Add a multi-stage Dockerfile and `.dockerignore`.
- [ ] Add GitHub Actions CI/CD workflow.
- [ ] Add Kubernetes deployment, service, ingress, HPA, config, and secret manifests.
- [ ] Integrate OpenTelemetry tracing.
- [ ] Add separate audit logging for mutations.

## Phase 5 — P3 resilience
- [ ] Add DB circuit breakers.
- [ ] Add exponential backoff with jitter for MongoDB and Redis retries.

## Definition of done
- [ ] Acceptance criteria in the production requirements doc are satisfied for each completed item.
- [ ] Batching behavior remains intact after each phase.
- [ ] Docs and deployment artifacts stay synchronized with implementation changes.
