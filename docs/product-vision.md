# Open Knowledge — product vision

This document describes what Open Knowledge is, what it deliberately is not,
and the principles that guide every product decision. Technical decisions are
recorded separately as [ADRs](./adr/README.md).

## The idea

The Internet made it possible to distribute knowledge at practically
universal scale. AI now adds a second step: processing, structuring,
synthesizing and translating enormous amounts of knowledge into accessible
learning materials, at a cost that was unthinkable until recently.

That capability can be used to produce ever more disposable, monetizable
content locked inside closed platforms — or it can be used in the opposite
direction. Open Knowledge exists for the second path: an open, self-hostable
tool with which anyone can curate knowledge, publish it as courses, and offer
it to others. **As a gift, not a business.**

The mission fits in four lines: someone deploys Open Knowledge. Publishes
knowledge. Someone else walks in. And learns.

## How it works

Each installation is an independent library. One administrator — the first
account registered on a fresh instance — curates and publishes its courses.

Anyone can browse the catalog and study complete courses **without
registering**, in the spirit of audit-mode learning: registration must never
become a barrier between a person and knowledge. Registering exists for one
reason only: keeping learning state. Progress across devices, exam results,
and course-completion certificates.

## Privacy is a feature

Open Knowledge does not need to know who you are to help you learn.

An account is a pseudonymous identity — a random word plus digits, like
`Erudito#4821` — secured with a TOTP authenticator and recoverable through a
one-time code. No name, no email, no phone, no profile. The data stored about
a user is strictly what the functionality requires: identity, credentials,
progress, exam results, certificates. The learner is not a product.

The single, deliberate exception is an optional display name used only on
certificates, entered voluntarily and removable at any time.

## What a course is

A course is a cover, a description, metadata that credits its authorship and
sources, and an ordered sequence of sections and materials — Markdown text,
audio, video, and exams. The order matters: a course presumes a pedagogical
path from the first material to the last.

Courses declare their language (the catalog filters by it), their content
license, and whether AI was involved in producing them. AI-assisted content
is welcome and clearly labeled — AI is used here to structure, synthesize,
translate and explain knowledge, never to erase where it came from. Sources
deserve credit.

Exams are just another material: an open, simple question format with
explanatory feedback, so the learner understands *why* an answer was right or
wrong instead of receiving a bare score. Completing a course earns a
certificate — not an academic credential, simply a beautiful, durable way of
recognizing that a learning path was walked to its end.

## The experience is the product

Quality of experience is an explicit requirement, not decoration. The
interface should feel like a place to read and learn, never like an
enterprise dashboard. Knowledge takes the center; the interface disappears
around it.

- **Study mode** is the heart of the app: at a glance you know what is done,
  where you are, and what comes next. Careful reading typography, excellent
  Markdown rendering, effortless continue-where-you-left-off.
- **Mobile first**: on a phone, Open Knowledge should feel practically like a
  native app. The desktop layout adapts from the mobile design, never the
  other way around.
- Animations are subtle and purposeful — they make the app feel alive, never
  noisy.

An open, self-hostable, free tool conceived as a gift must not feel worse
than a commercial product. The bar is the opposite: it should feel
extraordinarily good.

## The simplicity principle

Open Knowledge refuses to over-build. Fewer concepts, executed exceptionally
well. This version deliberately has **no** federation, remote repositories,
groups, contributor systems, voting, governance, complex roles, editor users,
communities, comments, followers, messaging, social profiles, marketplaces,
payments, subscriptions, cohorts, or enterprise LMS machinery.

If a real need ever appears because real users have it, it can be designed
then. We do not build infrastructure today for problems we do not have.

Simplicity applies to the number of concepts — never to the care put into
them.
