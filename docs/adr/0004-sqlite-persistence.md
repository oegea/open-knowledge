# ADR 0004 — SQLite persistence and filesystem media storage

**Status:** Accepted
**Date:** 2026-08-08

## Context

A self-hostable tool must not require operating a database server. Open Knowledge's data volume (one administrator, one course library) fits comfortably in an embedded database.

## Decision

- **Database:** SQLite through `better-sqlite3` (synchronous, fast, zero-config). Database file lives in `data/openknowledge.db`.
- **Media:** cover images, audio, and video are stored on the local filesystem under `data/media/`, served through a dedicated route handler.
- **Access:** only infrastructure-layer repositories (`Sqlite*Repository`) touch the database. Schema is created/migrated on startup by a lightweight migration runner (plain SQL, versioned in the repo).
- WAL mode enabled for concurrent reads.

The repository pattern (ADR 0001) keeps this choice replaceable: swapping storage means writing new `*Repository` implementations only.

## Consequences

- Backup = copy the `data/` directory.
- No connection pooling, no DB server operations, trivial local development.
- Horizontal scaling of writes is out of scope — aligned with the single-administrator model (ADR 0010/0011).
