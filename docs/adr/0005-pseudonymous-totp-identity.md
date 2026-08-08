# ADR 0005 — Pseudonymous identity with TOTP authentication

**Status:** Accepted
**Date:** 2026-08-08

## Context

Open Knowledge follows privacy by design: the platform does not need to know who you are to help you learn. Accounts exist only to persist learning state (progress, exam results, certificates). No name, email, phone, or any personal data is collected.

## Decision

### Identity

- On the registration page the user is auto-assigned an identifier: a random word followed by 3–4 random digits (e.g. `Erudito#4821`), with a refresh control to generate another.
- The identifier is the only public representation of the account. No profiles, bios, or social features.

### Authentication

- Registration shows a QR code compatible with authenticator apps (TOTP, RFC 6238). The user scans it, enters the current TOTP code, and confirms — only then is the identity created.
- Login = identifier + current TOTP code.
- Recovery: at registration the user receives a one-time recovery code they must store. It is persisted hashed and allows re-binding a new TOTP secret. No personal data involved.
- Sessions: httpOnly, sameSite cookies referencing server-side session records.

### Stored data (exhaustive)

Pseudonymous identifier, TOTP secret (encrypted at rest), hashed recovery code, role flag (admin), progress, exam results, certificates, notifications state. Nothing else; no additional profile fields will be invented.

### Administration controls

- The administrator can close registration entirely (the instance then works as a public read-only library).
- Registration is rate-limited.

## Consequences

- No password storage, no email infrastructure, no PII liability.
- Losing both the authenticator and the recovery code means losing the account — an accepted trade-off, communicated clearly in the UI.
- First registered user becomes the administrator (ADR 0011).
