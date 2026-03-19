# Clouded Moon Music — Ralph PRD

## Overview

This Ralph scaffold consolidates the current implementation context and the production hardening requirements for the Clouded Moon Music API. The project already contains meaningful GraphQL batching work; the remaining focus is production-readiness across security, reliability, operations, and deployment.

## Current State

### Already established
- NestJS API with REST and GraphQL interfaces.
- Polyglot persistence using MongoDB, PostgreSQL, and Redis.
- Database-level batching for GraphQL DataLoaders to reduce N+1 queries.

### Main gap
- The service is not yet production-ready according to the documented requirements in `docs/production-requirements.md`.

## Product Goal

Ship a production-safe Clouded Moon Music API that preserves the existing performance work while adding the minimum operational, security, and deployment guarantees expected for a real environment.

## Success Criteria

### Functional
- Authenticated mutation flows work for REST and GraphQL.
- Read/list APIs support pagination and versioned REST routes.
- Health, metrics, and structured logging are available for runtime operations.

### Non-functional
- Secrets are environment-driven and validated at startup.
- Unexpected failures return normalized errors without stack leakage.
- Shutdown, DB access, and runtime integrations behave safely under deployment conditions.

## Scope

### In scope
- Security hardening items P0/P1.
- Reliability and observability basics.
- API correctness and database safety items.
- Deployment scaffolding for Docker, CI, and Kubernetes.

### Out of scope
- Multi-region deployment.
- GDPR/compliance logging.
- Content negotiation beyond current API design.
- HATEOAS and XML/CSV support.

## Execution Strategy

1. Preserve the current batching implementation and avoid regressions.
2. Complete P0 production blockers first.
3. Complete P1 operational and API correctness work.
4. Add deployment and advanced observability scaffolding.
5. Layer resilience patterns last.

## Workstreams

### Workstream A — Preserve performance baseline
- Maintain DataLoader batch access patterns.
- Keep repository-backed batch queries for artists, genres, and songs.
- Ensure future auth/observability changes do not reintroduce N+1 behavior.

### Workstream B — Production hardening
- Add auth, rate limiting, security headers, CORS restrictions, and env validation.
- Remove secret defaults and fail fast when configuration is incomplete.

### Workstream C — Reliability and correctness
- Normalize errors, version routes, add pagination, and implement graceful shutdown.

### Workstream D — Operability and deployment
- Add health checks, metrics, structured logs, Docker assets, CI, and Kubernetes manifests.

### Workstream E — Advanced resilience
- Add tracing, audit logs, circuit breakers, and retry strategies.

## Ralph Operating Notes

- Use `context/implementation-prd.md` when changing GraphQL loading, repository methods, or performance-sensitive code.
- Use `context/production-requirements.md` when prioritizing production-readiness work.
- Use `tasks/backlog.md` as the execution source of truth.
