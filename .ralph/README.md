# Ralph Project Scaffold

This `.ralph` directory adapts the existing project context into a Ralph-friendly workspace.

## Structure

- `PRD.md` — a unified product and implementation brief derived from the repository docs.
- `context/implementation-prd.md` — normalized implementation context based on the batching implementation document.
- `context/production-requirements.md` — normalized production hardening requirements.
- `tasks/backlog.md` — sequenced execution backlog grouped by priority.
- `progress.md` — current status, assumptions, and next recommended execution slice.
- `notes/decisions.md` — explicit assumptions made during the scaffold.

## Source Documents

- `docs/database-level-batching-implementation.md`
- `docs/production-requirements.md`

## Intended Ralph Usage

1. Review `PRD.md` for project goals and constraints.
2. Execute work from `tasks/backlog.md` in order.
3. Update `progress.md` after each iteration.
4. Capture deviations and confirmed decisions in `notes/decisions.md`.
