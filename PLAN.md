# PLAN.md — Clouded Moon Music

Goal: turn this into a deployable personal music backend that different
frontends can point at. This document tracks planned features and rough
sequencing. Nothing here is implemented yet unless noted.

## Core (required before this is usable)

- **Auth** — simple but effective (e.g. JWT-based), enough to gate a
  personal deployment from the open internet.
- **Data ingestion** — a real pipeline for getting songs/artists/genres in,
  beyond manual seeding (e.g. importing from files/tags, not just REST calls).
- **File handling** — actual audio file storage and retrieval tied to song
  records (the `storage`/`tracks` modules already started in this repo look
  like first steps here).

## Recommended additions

- **Audio streaming with range requests** — byte-range support so a
  frontend can seek, not just download whole files.
- **Playlists** — first-class domain alongside songs/artists/genres.
- **Favorites / library** — per-user saved songs, separate from playlists.
- **Playback state & history** — resume position, play counts, recently
  played, for a real music-app UX.
- **Rate limiting / API keys per client** — since multiple frontends will
  point at one deployment.
- **Deployment story** — containerized app + managed or self-hosted
  Postgres/Mongo/Redis (docker-compose or a single VPS to start).

## Later phases (not day-one scope)

- Recommendations
- Multi-user sharing / social features
- Search relevance improvements beyond basic filtering

## Sequencing

1. Auth
2. Ingestion + file storage
3. Playlists / favorites / playback state
4. Streaming (range requests)
5. Everything else, as needed
