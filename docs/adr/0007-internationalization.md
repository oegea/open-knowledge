# ADR 0007 — Internationalization

**Status:** Accepted
**Date:** 2026-08-08

## Context

Open Knowledge should be usable in any language. Courses themselves are written in a language, and readers must be able to filter the catalog by it.

## Decision

- **UI locales (13):** Español (es), English (en), Français (fr), Deutsch (de), Italiano (it), 简体中文 (zh — Simplified Chinese, the software-industry standard), Русский (ru), Українська (uk), Català (ca), Galego (gl), Euskara (eu), Português (pt), 日本語 (ja).
- **No country flags.** Languages do not belong to countries. The language selector shows the native language name plus a visually distinctive 2-letter ISO tag (e.g. `EU · Euskara`).
- **Mechanism:** lightweight in-house i18n (`src/i18n`): JSON dictionaries per locale, nested keys, `{placeholder}` interpolation, server-side resolution (cookie → `Accept-Language` → default `en`), React context provider for client components. No heavyweight i18n framework — aligned with the simplicity principle (ADR 0010).
- **Courses:** each course declares its language; the catalog can filter by language. Course language is independent from UI language.
- Translations are maintained for every user-facing string in all 13 dictionaries; a missing key renders the key itself, making gaps visible in development and tests.

## Consequences

- Adding a locale = one JSON file + one registry entry.
- Dictionary JSONs stay flat enough to be maintained (and translated) mechanically.
