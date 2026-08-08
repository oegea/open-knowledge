# ADR 0010 — Simplicity principle and explicit non-goals

**Status:** Accepted
**Date:** 2026-08-08

## Context

Open Knowledge deliberately avoids overbuilding. Simplicity applies to the number of concepts and features — never to the quality of their execution. The few things the product does must be done exceptionally well.

## Decision

This version of Open Knowledge does NOT implement, and no code shall anticipate:

- Federation between instances, remote repositories, or course synchronization between servers.
- Groups, contribution systems, votes, governance, approval workflows.
- Complex roles or editor users — there is exactly one administrator (ADR 0011).
- Communities, comments, followers, messaging, social profiles.
- Marketplaces, payments, subscriptions.
- Cohorts, teacher/student management, or enterprise-LMS tooling.
- Per-course blogs or user publications (only the single instance news section, admin-published).

The user model is minimal: an administrator curates and publishes; anyone reads without registering; registration exists only to persist learning state (ADR 0005). Notifications stay limited to the learning experience and library news — never social or messaging features.

If a real need appears someday from real users, it will be designed then. We do not build infrastructure today for problems we do not have.

## Consequences

- Feature requests matching the list above are rejected by default, with this ADR as the reference.
- Design decisions must not add extension points "just in case" for excluded features.
- The saved complexity budget is reinvested in reading, study, and mobile experience quality.
