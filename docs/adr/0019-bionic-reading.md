# ADR 0019 — Bionic reading, the second facet of speed reading

**Status:** Accepted
**Date:** 2026-08-24

## Context

ADR 0018 brought the first speed-reading aid: the RSVP reader, a separate
full-screen mode. A complementary technique works the opposite way — it
stays on the normal text: **bionic reading** bolds the first ~40% of each
word (its *fixation* prefix), giving the eye an anchor to jump between so
it can infer the rest of the word from context and move faster. Unlike
RSVP it is not a mode you enter but a decoration you leave on while
reading normally.

The study view already wraps every word of a text material in a
`data-word` span (narration sync, ADR 0016; RSVP tokens, ADR 0018), so
the mechanism to decorate words per-word exists.

## Decision

**Speed reading is one concept with two facets, offered together** in a
labeled group by the material meta of the study view:

- the **RSVP reader** (ADR 0018) — a full-screen reading mode;
- the **bionic reading toggle** — an on/off decoration of the normal
  text (`aria-pressed`), available for the same materials RSVP is (any
  material with text).

### Bionic rendering

- `rehypeWordSpans` gains a `bionic` option: each word span's content is
  split into a `<b>` fixation prefix and the rest. The prefix is
  `max(1, ceil(0.4 × letters))` of the word's core; surrounding
  punctuation is never bolded, punctuation-only tokens are untouched.
- Everything downstream keeps working unchanged: spans keep their full
  `textContent`, so narration alignment, word tapping/seeking and the
  RSVP token capture are oblivious to the toggle.
- The rendering happens in the rehype pipeline — React owns the DOM;
  nothing rewrites text behind its back.

### Preference

- Device-local, like the RSVP settings: `localStorage`
  (`ok-bionic-reading`), exposed through `useBionicReading`, a
  `useSyncExternalStore` hook — the server renders the toggle off, the
  client adopts the stored value on hydration, and all consumers follow a
  flip instantly. No server state, no personal data (ADR 0005).
- The toggle applies to every study material on the device until turned
  off; exports and the reading experience elsewhere (news, pages) are
  untouched.

## Consequences

- Readers choose their aid: none, bolded anchors on the full text, or
  the word-by-word reader — mixing both is possible (bionic for study,
  RSVP for a fast pass).
- "Bionic Reading" as a brand is trademarked; the feature implements the
  generic bolded-fixation technique and the UI uses the generic term in
  each locale.
- The `<b>` elements exist only while the toggle is on; the DOM stays
  lean otherwise.
