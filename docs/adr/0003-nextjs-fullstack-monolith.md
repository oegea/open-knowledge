# ADR 0003 — Next.js full-stack monolith

**Status:** Accepted
**Date:** 2026-08-08

## Context

Open Knowledge is a self-hostable application. Anyone should be able to deploy their own library with minimal operational effort. A separate backend + frontend would double the deployment surface without adding value at this scale.

## Decision

Build Open Knowledge as a single Next.js (App Router) + TypeScript application:

- **UI** — React Server/Client Components under `src/app`.
- **API** — Next.js Route Handlers under `src/app/api/*`, acting as thin entrypoints that delegate to module factories (ADR 0001).
- **Business logic** — framework-agnostic modules under `src/modules`, following Clean Architecture. Nothing in `src/modules` imports from Next.js.
- Server-side code uses SQLite repositories directly; client components go through `HttpXRepository` implementations calling the API routes.

One process, one deployable unit, one `data/` directory holding all instance state (ADR 0004).

## Consequences

- Self-hosting is `pnpm build && pnpm start` (or one container).
- The `src/modules` tree stays portable: if a separate backend ever becomes necessary, modules move without rewriting business logic.
- Route handlers must stay thin; business orchestration lives in use cases.
