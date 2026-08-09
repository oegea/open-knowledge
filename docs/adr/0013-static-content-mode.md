# ADR 0013 — Static content mode (read-only library from a public repository)

**Status:** Accepted
**Date:** 2026-08-09

## Context

The standard deployment (ADR 0004) is stateful: SQLite plus uploaded media on
a persistent volume, one administrator curating content through the admin
panel. That requires a machine with a disk and carries operational weight
that is unnecessary for a common case: a library whose content changes by
editing files, wants near-zero hosting cost, and needs no accounts at all.

Publishing courses as plain files in a public git repository also aligns with
the product philosophy: open content, forkable, reviewable, versioned.

## Decision

Open Knowledge supports two mutually exclusive runtime modes, selected by one
environment variable. **Both modes ship in the same image**; no build-time
flags.

- **Database mode (default).** Exactly what exists today. `OK_CONTENT_REPO`
  is unset.
- **Static content mode.** `OK_CONTENT_REPO` is set to the base URL of a
  publicly readable content repository (e.g. a GitHub raw URL like
  `https://raw.githubusercontent.com/user/my-library/main`). The instance
  becomes a **read-only renderer** of that content.

### Static mode behavior

- Course, news, page and settings data are served by `Static*Repository`
  implementations that fetch JSON from the content repository over HTTP,
  with an in-memory cache (60s TTL + ETag revalidation). Write methods throw.
- **Identity does not exist**: no register, no login, no accounts, no
  notifications, no certificates, no admin panel. The UI never shows those
  entry points; their routes and API endpoints return 404. Registration is
  not "closed" — the concept is absent.
- Anonymous study keeps working exactly as in database mode: progress lives
  in the visitor's browser (localStorage), exams are graded per-request
  without persisting results.
- The deployment needs **no volume**: the container is stateless and
  disposable, so it can run on any container host, free tier, or platform
  without persistent disks.

### Content repository format

The format is deliberately **the existing domain primitives, serialized as
JSON** — the same shapes `toPrimitive()` produces and `fromPrimitive()`
consumes. No parallel schema, no mapping layer, no site generator:

```
settings.json              InstanceSettingsPrimitive
courses/index.json         string[] — course file names, catalog order
courses/<slug>.json        CoursePrimitive (sections and materials inline)
news/index.json            NewsPostPrimitive[] (newest first)
pages/index.json           PagePrimitive[]
media/...                  images referenced by the JSON via relative paths
```

Relative `mediaPath`/`coverImage`/`imagePath` values (`media/...`) are
resolved against `OK_CONTENT_REPO`. Absolute URLs pass through untouched.

### Scaffolding CLI

`scripts/init-content-repo.sh <directory>` — plain POSIX sh, zero dependencies,
runnable via curl straight from the app repository — generates a ready-to-publish
content repository: valid example course, news post, about page, settings,
a README with guided deploy options (one-click Vercel, Docker, container
platforms), and a CLAUDE.md/AGENTS.md pair documenting every content format
in detail so AI coding assistants can author courses in the repository. It is
a scaffolder, not a build tool — the generated files are the deployable
format. Since static mode is stateless, serverless platforms (e.g. Vercel)
can host it: the SQLite limitation belongs to database mode only.

## Consequences

- Two deployment stories, one codebase: VPS + volume for interactive
  administration; static repo + stateless container for zero-maintenance
  libraries. A static library can later migrate to database mode by
  recreating content in the admin panel (or vice versa by exporting).
- The content repository is the source of truth and is public by definition;
  static mode must never be used for content that cannot be public.
- Repositories added for static mode implement the same interfaces as the
  SQLite ones (ADR 0001 pays off); the identity/assessment/certificate
  modules are simply never wired in static mode.
- Publishing a content change is a git push; the instance picks it up within
  the cache TTL without redeploying.
