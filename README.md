# Open Knowledge

**An open, self-hosted library of knowledge.** Deploy your own instance, curate and publish courses, and offer them openly to anyone who wants to learn.

In a world where AI lets us distill knowledge at a scale that used to be unthinkable, Open Knowledge is the open tool to organize that knowledge, publish it, and offer it to others — as a gift, not a business. The learner is not a product: no names, no emails, no profiles. If someone just wants to read, they can. If they want to keep their progress, they get a pseudonymous identity and nothing more.

## What it does

- **Public course library** — anyone can browse the catalog, filter by language and category, and study complete courses without registering (audit-style).
- **Study mode** — careful long-form reading typography, markdown/audio/video materials, sequential navigation, visual progress, continue-where-you-left-off.
- **Exams with feedback** — simple open JSON question format; after answering you see why an answer was right or wrong, not just a score.
- **Pseudonymous accounts** — a random identity like `Erudito#4821` plus a TOTP authenticator. No personal data, ever. Recovery via a one-time code.
- **Progress, results and certificates** — registered learners keep progress across devices, exam results are graded and recorded server-side, and completing a course earns a beautiful shareable certificate.
- **Single administrator** — the first account registered becomes the admin: full course editor (sections, materials, exam builder, media uploads), instance settings, optional news/blog section.
- **Notifications** — new courses, news and earned certificates, right in the header. Nothing social.
- **13 languages** — Español, English, Français, Deutsch, Italiano, 简体中文, Русский, Українська, Català, Galego, Euskara, Português, 日本語. Courses declare their own language and the catalog filters by it.
- **Mobile-first** — designed for phones and tablets first, with touch-sized controls and fluid, subtle animations. Light and dark themes.

## Self-hosting

Requirements: Node.js 20+ and pnpm.

```bash
pnpm install
pnpm build
pnpm start          # serves on port 3000
```

Open the instance, register the first account (it becomes the administrator, guard its recovery code), and start publishing.

All instance state — SQLite database, uploaded media, encryption key — lives in the `data/` directory. **Backing up your library is copying that folder.** Set `OK_DATA_DIR` to relocate it.

## How to deploy

One honest note first: Open Knowledge is deliberately stateful — a SQLite database and uploaded media on local disk, zero external services. That is what makes it self-hostable with no configuration, but it also means it cannot run on function-based serverless platforms (Vercel/Netlify functions, AWS Lambda), whose filesystems are wiped between invocations. The closest thing to "serverless" that fits is a **container platform with a persistent volume**: no servers to manage, scale-to-one, a volume for `/data`.

### Fastest path: Fly.io (~5 minutes)

The repository ships a production `Dockerfile` that stores everything in `/data`. With [flyctl](https://fly.io/docs/flyctl/install/) installed:

```bash
fly launch --no-deploy        # detects the Dockerfile; pick a region, don't add Postgres/Redis
fly volumes create ok_data --size 1
```

Add the volume mount to the generated `fly.toml`:

```toml
[mounts]
  source = "ok_data"
  destination = "/data"

[env]
  OK_DATA_DIR = "/data"
```

```bash
fly deploy
```

Open the app URL, register the first account (it becomes the administrator — guard its recovery code), and start publishing. Keep exactly **one machine** (`fly scale count 1`): SQLite wants a single writer.

### Any other container host

The same image runs on Railway, Render, a VPS with Docker, or a Raspberry Pi on your shelf. The only rule is always the same: **mount a persistent volume at `/data`.**

```bash
docker build -t open-knowledge .
docker run -d -p 3000:3000 -v ok_data:/data open-knowledge
```

Migrations are automatic and additive: redeploying a new version on the same volume upgrades the database in place. Disaster recovery is built in — the admin panel exports a full environment backup as a zip, and restoring it on a fresh instance brings everything back.

## Development

```bash
pnpm dev            # dev server on :3000
pnpm test           # unit + integration tests (Jest)
pnpm test:e2e       # end-to-end suite (Playwright: mobile / tablet / desktop)
pnpm lint
```

## Architecture

Next.js (App Router) full-stack monolith. Business logic lives in framework-agnostic modules under `src/modules/{context}/` following Clean Architecture with DDD-style bounded contexts (domain / application / infrastructure / test). Every architectural, product and design decision is recorded in [`docs/adr`](./docs/adr/README.md).

## Philosophy

Knowledge takes the center. The interface disappears around it. Technology makes publishing simpler, AI helps structure knowledge without hiding where it came from — and the quality of the experience proves that an open, self-hostable, free tool conceived as a gift doesn't have to feel worse than a commercial product.

Someone deploys Open Knowledge. Publishes knowledge. Someone else walks in. And learns.
