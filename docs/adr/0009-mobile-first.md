# ADR 0009 — Mobile-first experience

**Status:** Accepted
**Date:** 2026-08-08

## Context

Usability on smartphones and tablets is the top-priority, non-negotiable product rule. The desktop design must never be built first and shrunk afterwards.

## Decision

- Every screen is designed for a ~360–430px portrait viewport first; larger layouts are progressive enhancements via `min-width` media queries.
- On a smartphone, the core flows (library browsing, course page, study mode, exams, progress) must feel close to a native app: touch-sized controls (≥44px), one-hand reachability where reasonable, smooth scroll, fluid subtle animations, careful long-form reading, correct media playback, portrait orientation as the primary case.
- CSS is written mobile-base + `min-width` overrides (see `page.module.css` pattern).
- Playwright runs every E2E flow on three projects — mobile (Pixel-class), tablet (768px, touch), desktop (1440px) — so mobile regressions fail CI, not user sessions (ADR 0002, ADR 0012).
- UI reviews happen in mobile viewport first, in both themes.

## Consequences

- Fewer features, executed exceptionally well on small screens.
- Any component unusable at 360px is considered broken regardless of its desktop behavior.
