<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Open Knowledge — project conventions

- Business logic lives in `src/modules/{context}/{domain,application,infrastructure,test}` (Clean Architecture + DDD). Nothing in `src/modules` imports from Next.js.
- Route handlers and pages are thin entrypoints: guards + ONE factory call. Factories are wiring-only.
- Every class talking to an external system is a `*Repository`. Use cases are functions taking a single props object.
- Tests: Object Mothers (functions) + `RepositoryMother` factories of `jest.fn()` mocks. Unit tests for use cases are mandatory. Run `pnpm test` and `pnpm test:e2e`.
- All UI strings go through i18n: add keys to ALL 13 dictionaries in `src/i18n/dictionaries/` (key parity is enforced by review).
- Styles consume `--ok-*` design tokens from `src/app/globals.css`; mobile-first CSS with `min-width` overrides; both light and dark themes.
- Architectural decisions are ADRs in `docs/adr` — read them before changing structure.
