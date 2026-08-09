# ADR 0014 — AI tooling without becoming an AI provider

**Status:** Accepted
**Date:** 2026-08-09

## Context

AI assistants are genuinely useful study companions: they can explain a
lesson in other words, answer questions and quiz a learner. It is tempting
to build that into the product — a chat widget, a tutor endpoint, an
"ask the course" box.

Doing so would make Open Knowledge an **AI service provider**: API keys to
provision, per-token costs someone must pay, usage to meter, abuse to
police, a third-party dependency at the heart of a self-hosted tool, and
learner conversations flowing through our infrastructure. Every one of
those clashes with the project's principles: zero external services, no
variable costs, no personal data, no learner-as-product.

## Decision

**Open Knowledge gives LLMs ways to connect, but never operates an AI
service of its own.**

- No API keys, no server-side model calls, no proprietary chat interface,
  no per-token costs — in either deployment mode, ever.
- Instead, the application produces **artifacts and links that the
  visitor's own standard AI client can consume**, with the visitor's own
  account and on their own terms.

Concretely, today:

- Every published course serves a **plain-Markdown edition of itself** at
  `/courses/<slug>/llms.txt` (following the llms.txt convention):
  metadata, bibliography and full lesson text in one fetchable document.
  Exam questions and answers are excluded — a tutor should generate its
  own questions, not hand over the answer key.
- The course page offers **"Study with AI" links** that open a new
  conversation in the visitor's standard client (ChatGPT via
  `chatgpt.com/?q=`, Claude via `claude.ai/new?q=`) with a prompt written
  in the course's language instructing the assistant to fetch the
  llms.txt URL and act as a tutor.

This is the simplest mechanism aligned with the vision: **URL-based
handoff**. The AI relationship belongs entirely to the visitor; the
library's only job is to make its knowledge easy for any assistant to
read — which is the same openness it owes human readers.

## Consequences

- Zero cost, zero keys, zero liability: nothing to provision or meter, no
  conversations pass through the instance, and the feature works
  identically in static and database modes.
- The tutor requires the visitor to have their own assistant account, and
  the instance must be publicly reachable for the assistant to fetch the
  course text. Both are inherent to the handoff model, not defects.
- Client URL schemes (`?q=`) are third-party conventions and may change;
  the endpoint is ours and stable. If a scheme breaks, the prompt is
  visible and the llms.txt URL is copyable by hand.
- Future work may add richer connection surfaces (e.g. an MCP server the
  visitor configures in their client) under the same rule: **tools for
  LLMs to come to the library — never a library that operates an LLM.**
