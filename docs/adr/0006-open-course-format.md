# ADR 0006 — Open course content format

**Status:** Accepted
**Date:** 2026-08-08

## Context

Publishing knowledge must not depend on proprietary formats, and the model must make it especially easy to introduce AI-generated or AI-curated content.

## Decision

### Structure

A **course** contains ordered **sections** (logical divisions); each section contains ordered **materials** (the content to consume). Materials are consumed in their defined pedagogical order.

### Course metadata

Minimum: title, description, cover image. Additionally: language (from the supported locale list, ADR 0007), category, authorship, sources/attribution, and an **AI usage flag**. When the AI flag is set, the study mode shows a clear notice before starting the course. Sources must be representable at course and material level — AI is a tool to structure and explain knowledge, never a mechanism to erase its provenance.

### Material types

| Type | Content |
|---|---|
| `markdown` | CommonMark + GFM text |
| `audio` | Audio file + optional markdown notes |
| `video` | Video file + optional markdown notes |
| `exam` | Open JSON question format (below) |

### Exam format

Plain JSON, deliberately simple so questions can be generated easily (including by AI):

```json
{
  "questions": [
    {
      "id": "q1",
      "text": "Which planet is closest to the Sun?",
      "choices": [
        { "id": "a", "text": "Venus" },
        { "id": "b", "text": "Mercury" },
        { "id": "c", "text": "Mars" }
      ],
      "correctChoiceId": "b",
      "explanation": "Mercury orbits at ~0.39 AU, closer than any other planet."
    }
  ],
  "passingScore": 0.7
}
```

After answering, the UI gives clear feedback and shows the explanation — understanding beats scoring. This is not an academic evaluation engine and will not grow into one.

### Completion

A course defines which materials are required and whether exams must be passed. Meeting the requirements marks the course as completed and (for registered users) unlocks the certificate.

## Consequences

- Content is portable: markdown + JSON + media files.
- AI-assisted pipelines can produce valid courses trivially.
- The format is versioned with the schema; future extensions must stay backward compatible.
