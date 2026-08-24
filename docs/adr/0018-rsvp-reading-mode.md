# ADR 0018 — RSVP reading mode for text materials

**Status:** Accepted
**Date:** 2026-08-24

## Context

Long-form reading on a phone competes with everything else on the screen.
There is a well-studied presentation technique that removes the main
mechanical cost of reading — moving the eyes: **RSVP** (*Rapid Serial
Visual Presentation*) shows the text one word at a time at a fixed point,
so no saccades are needed. Its modern form (popularized by Spritz) aligns
every word on its **ORP** (*Optimal Recognition Point*): the letter the
eye locks onto to recognize a word, sitting left of center and further
left the longer the word is. The ORP letter is highlighted and always
rendered at the same spot; the reader's gaze never moves.

This fits the product exactly where it is strongest: the mobile study
experience (ADR 0009), for free, with zero dependencies.

## Decision

### Where it applies

Any material **with text**: `markdown` materials, and `audio`/`video`
materials that carry notes. Audio or video without text offers playback
only; exams are answered, not read. The entry point is a clearly labeled
pill next to the material meta — always in the same place, never floating
over the text.

### The reader

- Full-screen overlay in the study view. Two horizontal guides with inward
  ticks mark the anchor; the word renders in the reading serif with the
  ORP letter in the Ember accent, laid out on a `1fr auto 1fr` grid so the
  ORP letter stays centered regardless of the word's mass.
- **A tap anywhere is play/pause** (controls stop propagation; with the
  settings sheet open, a tap closes it instead). On keyboards, space
  toggles playback, the arrow keys step word by word (auto-repeating
  while held), and Escape leaves.
- Speed is chosen from predefined values (200–700 wpm, default 300);
  every sentence ends with a pause chosen from three predefined levels
  (short — the default —, medium, long). Longer words and clause commas
  earn extra beats. Preferences persist in `localStorage`
  (`ok-rsvp-preferences`) — a per-device convenience, never server state.
- While reading, the bottom bar shows elapsed and remaining time (derived
  from the frame durations, recomputed when speed changes) and a seekable
  position slider.
- Reaching the end **marks the material as completed** (same semantics as
  finishing it by scrolling) and shows a full-screen completion state
  inviting the reader to the next material — or back to the text.
- Leaving the reader scrolls the page to the word where the reading
  stopped.

### Implementation shape

- The tokens come from the DOM the study view already renders:
  `rehypeWordSpans` (ADR 0016) now annotates every study material with
  text, and the reader reads `[data-word]` spans in document order. What
  is read is exactly what is displayed, and the exit scroll lands on the
  very span the reading stopped at. Rendering markdown a second time for
  the reader would risk divergence; the spans cannot.
- Frame building (ORP position, weights, sentence detection) and timing
  are pure functions in `rsvp.ts`, unit-tested; `RsvpReader` is a client
  component owning only presentation state.
- The word stage is `aria-hidden`: a screen reader gets the full text on
  the page, not a word every 200 ms. The dialog, its controls and the
  completion state are fully labeled.

## Consequences

- Reading a chapter becomes a hands-free, eyes-still experience on any
  phone, at a pace the reader chooses, with no new dependencies and no
  personal data (ADR 0005): the only state is a device-local preference.
- Comprehension at very high speeds is the reader's trade-off to make;
  the default (300 wpm, short pauses) stays conservative.
- Materials with word-heavy non-prose content (tables, code) read
  awkwardly in RSVP — the mode is optional and one tap away from the
  normal text, which remains the canonical presentation.
