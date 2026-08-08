# ADR 0011 — First registered user becomes the administrator

**Status:** Accepted
**Date:** 2026-08-08

## Context

Every Open Knowledge installation needs exactly one administrator who curates and publishes content, without requiring installation wizards, seed scripts, or configuration files with credentials.

## Decision

- On a fresh installation, the first identity registered through the UI is automatically marked as the system administrator.
- The check happens atomically inside the registration use case (count of existing users == 0 → admin), preventing races on concurrent first registrations.
- The administrator gets access to the admin panel: courses, sections and materials management, publish/unpublish, library configuration, registration configuration (open/closed, rate limits), and the news/blog section when enabled.
- There is no UI to create additional administrators — the single-admin model is deliberate (ADR 0010). Simplifying the functional model does not mean neglecting the admin panel: its UX must be excellent and make course creation and maintenance genuinely pleasant.

## Consequences

- Zero-config bootstrap: deploy, open, register, publish.
- The registration screen on a fresh instance is the de facto setup screen; it must communicate that the first account will be the administrator.
