# ADR 0008 — Design system: own brand, liquid glass

**Status:** Accepted
**Date:** 2026-08-08

## Context

Visual and interaction quality is an explicit product requirement. Open Knowledge must have its own brand identity — not a generic dashboard look, not a copy of default AI-generated aesthetics. The inspiration is liquid-glass design language: translucent layered surfaces, depth, blur, subtle specular highlights, fluid motion.

## Decision

- **Single source of truth:** CSS custom properties in `src/app/globals.css`, all prefixed `--ok-*`. Components consume tokens; hardcoded values are forbidden.
- **Palette:**
  - *Lagoon* (teal scale) — brand primary: knowledge, clarity, calm.
  - *Ember* (warm amber) — accent for progress and achievement.
  - *Mist* (cool neutrals) — backgrounds and text.
- **Glass surfaces:** `.ok-glass` / `.ok-glass-strong` utilities — translucent backgrounds, `backdrop-filter` blur + saturation, 1px translucent border, inset top highlight, layered soft shadows. Ambient radial color washes behind the page make the translucency perceptible.
- **Typography:** Manrope (UI/display), Source Serif 4 (long-form reading), Geist Mono (code). Reading measure capped at `--ok-measure-reading` (42rem), generous line height for study content.
- **Dark mode:** first-class. `prefers-color-scheme` is the default signal; an explicit `data-theme` attribute on `<html>` overrides it in both directions. Both themes ship with every component.
- **Motion:** subtle and purposeful — durations 150/250/420ms with a single standard easing curve; `prefers-reduced-motion` collapses all animation. Animations must aid navigation comprehension, never decorate.
- **Ergonomics:** minimum touch target 44px (`--ok-touch-target`), focus-visible outlines everywhere, radii scale from 8px to 28px for the soft-glass look.

## Consequences

- Rebranding or theming is a token edit, not a refactor.
- Every new component starts from tokens + glass utilities, keeping the app visually coherent as it grows.
