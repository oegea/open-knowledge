# ADR 0012 — Empirical validation of every deliverable

**Status:** Accepted
**Date:** 2026-08-08

## Context

No change in this project is considered done because it "should work". Every deliverable must be validated end-to-end by whoever implements it before being handed over.

## Decision

A change is valid only when all of the following hold:

1. **Automated tests** — unit tests (mandatory for use cases), integration tests where adapters are non-trivial, and E2E tests for user-facing flows (ADR 0002) — all passing.
2. **The application actually runs** — services/frontend are started and the affected flow is exercised for real, not just compiled.
3. **UI/UX changes are verified visually at multiple resolutions** — at minimum mobile (~360px), tablet (768px), and desktop (1440px), in both light and dark themes, honoring the mobile-first rule (ADR 0009). Playwright screenshots or a real browser session are the evidence.
4. **Version control** — work is committed to `main` in small, coherent commits as it progresses.

## Consequences

- Slower per-change, drastically fewer regressions.
- E2E infrastructure (Playwright, three viewport projects) is maintained from day one and kept green.
