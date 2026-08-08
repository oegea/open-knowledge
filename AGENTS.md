<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Open Knowledge — project conventions

## Architecture

- Business logic lives in `src/modules/{context}/{domain,application,infrastructure,test}` (Clean Architecture + DDD). Nothing in `src/modules` imports from Next.js.
- Modules: `course`, `media`, `identity`, `settings`, `study`, `assessment`, `certificate`, `news`, `notification`, `pages`, `backup`, `export`, `shared`.
- Route handlers and pages are thin entrypoints: guards + ONE factory call. Factories are wiring-only.
- Every class talking to an external system is a `*Repository`. Use cases are functions taking a single props object.
- Domain objects are immutable, with `create`/`fromPrimitive`/`toPrimitive` and an `XPrimitive` type. Mutation methods return new instances.
- Modules never import each other's internals. Cross-module orchestration happens through optional callback ports injected by factories (e.g. `onFirstAdminRegistered`, `onCoursePublished`, `onDisplayNameChanged`).
- Architectural decisions are ADRs in `docs/adr` — read them before changing structure. ADRs must stay self-contained (no links to external private repos).

## Persistence & security

- SQLite via `better-sqlite3` (WAL) in `src/modules/shared/infrastructure/SqliteDatabase.ts`. Schema changes are additive only, via `addColumnIfMissing` — never edit CREATE TABLE for existing columns.
- `getDatabase()` and SecretBox re-open handles when the file inode changes (backup restore replaces files while duplicate bundler module copies hold stale handles). Preserve that check.
- Secrets (TOTP) are AES-256-GCM encrypted with an auto-generated `data/instance.key`. Session tokens are stored hashed.
- `otplib` v13 has a functional API only (`generateSecret`/`generateURI`/`verify`); `verify` is async and returns `{ valid }` — there is no `authenticator` export.
- Privacy by design: no personal data is collected. The ONLY optional personal field is the user's certificate display name (see ADR 0005) — do not add profile fields.
- `data/`, uploaded images, and `.e2e-data/` are local instance state and MUST never be committed.

## Testing & validation

- Tests: Object Mothers (functions) + `RepositoryMother` factories of `jest.fn()` mocks. Unit tests for use cases are mandatory. Run `pnpm test` and `pnpm test:e2e`.
- Frontend unit tests use RTL with ARIA-role queries; never assert on CSS classes.
- E2E: Playwright against an isolated instance (`.e2e-data`, port 3100) with a `seed.setup.ts` project dependency; locale pinned to `es-ES`; runs at mobile/tablet/desktop viewports. Registration does real TOTP via otplib.
- Next 16 refuses a second `next dev` per project — kill the dev server before `pnpm test:e2e`.
- Validation is empirical, not just tests: run the app and visually verify UI at ~360, 768, and 1440 px, in BOTH themes, INCLUDING logged-in admin views, before claiming anything done. For generated files, inspect the real artifact (unzip the EPUB, render the PDF to png with `sips`).

## i18n

- All UI strings go through i18n: add keys to ALL 13 dictionaries in `src/i18n/dictionaries/` (key parity is enforced by review). English is the deep-merge fallback; interpolation uses `{placeholder}`.
- Default seeded content (About page, welcome course) is English.
- The dev server caches dictionary JSON modules — restart it after adding keys, or you'll see raw key names and misdiagnose it as a bug.

## UI

- Styles consume `--ok-*` design tokens from `src/app/globals.css`; mobile-first CSS with `min-width` overrides; both light and dark themes (`prefers-color-scheme` + `data-theme` cookie). Glass surfaces use the `ok-glass`/`ok-glass-strong` utilities.
- Mobile is the top priority: below 900px navigation uses the app-like sheet menus (`MobileMenu`, `AdminMobileMenu`). Never let the header overflow horizontally — no global `body > * { width }` rules.
- Icons come from `src/components/ui/icons.tsx` (brand SVG set), never emojis.

## Build & tooling gotchas

- `npm` is aliased to pnpm on this machine; native deps need `allowBuilds` in `pnpm-workspace.yaml`.
- `pdfkit`, `better-sqlite3`, and `sharp` must stay in `serverExternalPackages` in `next.config.ts` (Turbopack bundling breaks them — pdfkit loses its .afm font files).
- pdfkit accepts only JPEG/PNG images — convert everything else to PNG with `sharp` first. `doc.image()` with explicit coordinates does NOT advance `doc.y`; and `doc.text()` with an explicit x shifts the current text box for subsequent calls (reset x/width to re-center).
- EPUB output must store the `mimetype` entry uncompressed and first (`entry.header.method = 0` with adm-zip).
