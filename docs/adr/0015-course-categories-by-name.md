# ADR 0015 — Course categories associate by name

**Status:** Accepted
**Date:** 2026-08-12

## Context

The course catalog started as the home page with a flat grid and filter
chips. That works for a handful of courses, but a large library needs a
pre-filter: a landing page of category cards that narrows the catalog before
the visitor ever sees the full list.

A course's `category` has always been a **free-text string** (`courses.category`,
`CoursePrimitive.category`), documented as such in the open course content
format (ADR 0006) and in every content repository scaffolded for static mode
(ADR 0013). Turning it into a foreign key would require a data migration,
break every existing content repository, and complicate static mode — all to
support what is essentially presentation metadata (a card image).

## Decision

**The free-text string on the course remains the source of truth. A
`Category` entity exists only to decorate one of those names with a card
image.**

- The `Category` aggregate (`src/modules/category`) is minimal: `id`, unique
  `name` (≤100 chars, same limit the course field enforces), optional
  `imagePath`, timestamps. No slug, no description, no ordering field.
- **Association is by exact, case-sensitive name match** — the same
  semantics the catalog filter has always used (`category = ?` in SQLite,
  `===` in the static repository). `Ciencia` and `ciencia` are two
  categories.
- The home page (`/`) is the **categories landing**: one card per category
  derived from the *published courses* (`CourseList.getCategoryCounts()`),
  decorated with the managed entity's image when one matches, otherwise an
  auto-generated gradient card. Categories with zero published courses show
  no card — a card leading to an empty catalog is a dead end. A final "view
  all courses" card links to the full catalog, which moved to `/courses`;
  legacy `/?category=…&language=…&q=…` links redirect there with their
  parameters intact.
- **Deleting** a category entity never touches courses: they keep their
  string and their card degrades to the auto-generated one.
- **Renaming** a category cascades: `updateCategory` exposes an optional
  `onCategoryRenamed(from, to)` port, wired by the category factory to the
  course module's `recategorizeCourses` (a single
  `UPDATE courses SET category = ? WHERE category = ?`). Without the
  cascade, renaming would silently orphan every course under the old name —
  a trap, not simplicity.
- The admin course form keeps its free-text category input and gains a
  `<datalist>` of managed names fetched from `GET /api/categories` — a
  suggestion, never a constraint.
- **Static content mode** (ADR 0013) gains an *optional* `categories/`
  folder: `categories/index.json` (entry names) plus one
  `categories/<name>.json` per entry (`CategoryPrimitive`, image resolved
  like every other content-repo path). A repository without the folder
  simply has no managed categories — the landing still derives cards from
  the courses. Writes stay blocked by the API proxy as for every module.

## Consequences

- Zero migration: existing databases and content repositories keep working
  unchanged; the `categories` table and `categories/` folder are additive.
- A category is "created" implicitly by typing a new string on a course;
  the admin section only manages the decoration. Both stay in sync by
  construction because there is nothing to sync.
- Case variants are distinct categories. The admin datalist nudges toward
  reusing existing names; it cannot prevent variants.
- The landing derives everything from two reads already needed elsewhere
  (published courses + category list) — no counters to maintain.
