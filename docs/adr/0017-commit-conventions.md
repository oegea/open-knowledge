# ADR 0017 — Commit conventions

**Status:** Accepted
**Date:** 2026-08-22

## Context

The history of this repository is a deliverable in itself: it is read to understand why code exists, to bisect regressions, and to generate change summaries. Part of the code is written with AI coding tools (which is fine and expected here), and those tools tend to inject their own metadata into commit messages — `Co-Authored-By` trailers, "Generated with X" footers, tool names. That metadata says nothing about the change, varies from tool to tool, and accumulates as noise that the reader must skip.

## Decision

1. **Conventional Commits.** Every commit message follows the [Conventional Commits](https://www.conventionalcommits.org/) format: `type(scope): summary`, with `feat`, `fix`, `docs`, `refactor`, `test`, `chore` (and similar) as types and the affected module or area as optional scope. The summary is written in the imperative and explains the change, not the activity ("fix(study): cap the contents rail", not "fixed some CSS").
2. **A body when the why is not obvious.** Non-trivial commits carry a short body explaining the reasoning or the bug mechanism — the information a future reader cannot recover from the diff.
3. **No co-author trailers, no tool references.** Commits carry no `Co-Authored-By` trailers and no mention of the AI tool (or editor, or any tool) used to produce them. Authorship is the committer's; responsibility for the change is theirs regardless of how it was typed. AI transparency in this project applies to *published content* (the `aiAssisted` course flag, ADR 0006), not to commit metadata.
4. **Small and coherent.** One logical change per commit (ADR 0012 already requires committing to `main` in small, coherent steps); unrelated changes are split.

## Consequences

- `git log --oneline` reads as a changelog; types make the history filterable.
- AI coding tools must be configured or instructed not to append their trailers/footers; a commit that slips through gets reworded before (or, exceptionally, after) pushing.
- No commit-lint tooling is added for now — the convention is enforced by review, like the rest of the style rules.
