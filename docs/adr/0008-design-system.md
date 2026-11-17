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
- **Gradients:** gradients are built from the semantic aliases (and shared ones are tokens: `--ok-gradient-hairline`, `--ok-glow-primary`), so they follow the theme. They are used subtly: display headings, hairline dividers, primary actions, hero atmospheres. Body text is never set in a gradient.
- **Glass surfaces:** `.ok-glass` / `.ok-glass-strong` utilities — translucent backgrounds, `backdrop-filter` blur + saturation, 1px translucent border, inset top highlight, layered soft shadows. Ambient radial color washes behind the page make the translucency perceptible.
- **Typography:** Manrope (UI/display), Source Serif 4 (long-form reading), Geist Mono (code). Reading measure capped at `--ok-measure-reading` (42rem), generous line height for study content.
- **Dark mode:** first-class. `prefers-color-scheme` is the default signal; an explicit `data-theme` attribute on `<html>` overrides it in both directions. Both themes ship with every component.
- **Motion:** fluid but purposeful — durations 150/250/420ms (700ms for scroll reveals) with a single standard easing curve; `prefers-reduced-motion` collapses all animation, including looping ones. Motion comes in three kinds, all built from tokens (see *Amendment 2026-11-17*):
  - *Entrance:* content settles in on load, and content below the fold fades and rises as it scrolls into view (`data-reveal`, driven by the `MotionEffects` component mounted in the root layout). Only elements below the viewport are ever hidden, so nothing flashes and nothing depends on JavaScript to be visible.
  - *Response:* hover and press feedback — lift, brand-tinted borders, a sheen on primary actions, a soft light that follows the cursor across cards (`data-spotlight`, fine pointers only).
  - *Ambient:* slow, low-contrast drift in backdrops and hero atmospheres (transform/opacity only, so it stays on the compositor). Ambient motion never moves text or controls.
- **Ergonomics:** minimum touch target 44px (`--ok-touch-target`), focus-visible outlines everywhere, radii scale from 8px to 28px for the soft-glass look.

## Consequences

- Rebranding or theming is a token edit, not a refactor.
- Every new component starts from tokens + glass utilities, keeping the app visually coherent as it grows.

## Amendment 2026-11-17 — richer motion and gradients

The original rule was "animations must aid navigation comprehension, never decorate". In practice the interface read as static next to contemporary products, so the rule is relaxed: decorative motion is allowed as long as it stays subtle, is built from the motion tokens, never moves text or controls on its own, never hides content from users without JavaScript, and disappears under `prefers-reduced-motion`. The *Motion* and *Gradients* bullets above describe the resulting system.
