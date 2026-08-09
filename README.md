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

One honest note first: in its default mode Open Knowledge is deliberately stateful — a SQLite database and uploaded media on local disk, zero external services. That mode wants a plain machine with a disk, which is also the deployment with **no variable costs**: a fixed-price VPS cannot surprise you with a bandwidth bill. (If your library doesn't need accounts, the [static content mode](#static-content-mode-no-database-at-all) below is fully stateless and runs anywhere, serverless included.)

### Recommended: any VPS with Docker (fixed monthly cost)

The repository ships a production `Dockerfile` that stores everything in `/data`. On any small VPS (1 vCPU / 512 MB is plenty to start), a Raspberry Pi, or a home server:

```bash
git clone https://github.com/oegea/open-knowledge.git && cd open-knowledge
docker build -t open-knowledge .
docker run -d --name open-knowledge --restart unless-stopped \
  -p 3000:3000 -v ok_data:/data open-knowledge
```

Put your reverse proxy of choice (Caddy makes HTTPS one line: `caddy reverse-proxy --from your-domain.example --to :3000`) in front, open the URL, register the first account (it becomes the administrator — guard its recovery code), and start publishing.

To upgrade: `git pull`, rebuild, recreate the container with the same `-v ok_data:/data`. Migrations are automatic and additive — the database upgrades in place. **Backing up is copying the volume** (or using the admin panel's one-click environment backup zip, which restores onto any fresh instance).

### Container platforms

The same image runs on container hosts with persistent volumes (Fly.io, Railway, Render). They trade the fixed VPS price for usage-based billing — mind that most have no hard spending cap. The only rule is always the same: **mount a persistent volume at `/data`, and keep exactly one instance** (SQLite wants a single writer).

### Static content mode: no database at all

For libraries that don't need accounts, there is a second way to run Open Knowledge ([ADR 0013](./docs/adr/0013-static-content-mode.md)): the content lives in a **public git repository** and the container is completely stateless — no volume, no database, disposable, so it runs on anything that can host a container, including free tiers.

Scaffold a content repository with one command (plain `sh`, no dependencies):

```sh
curl -fsSL https://raw.githubusercontent.com/oegea/open-knowledge/main/scripts/init-content-repo.sh | sh -s my-library
```

Push `my-library/` to a public GitHub repository, then deploy the app pointing at it. **Because this mode is stateless, even serverless platforms work** — the scaffolded README walks you through both paths, including a one-click Vercel deploy:

```sh
docker run -d -p 3000:3000 \
  -e OK_CONTENT_REPO=https://raw.githubusercontent.com/<user>/my-library/main \
  open-knowledge
```

In this mode **git is the admin panel**: edit a JSON file, push, and the library updates within a minute. Visitors browse, study and take exams anonymously (progress stays in their browser); registration, notifications, certificates and the admin panel simply don't exist. The scaffolded repository ships a README with guided deploy options and an `AGENTS.md`/`CLAUDE.md` pair that teaches AI coding assistants every content format — ask Claude Code to "add a course about X" inside your content repo and it knows exactly what to do.

## Development

```bash
pnpm dev            # dev server on :3000
pnpm test           # unit + integration tests (Jest)
pnpm test:e2e       # end-to-end suite (Playwright: mobile / tablet / desktop)
pnpm lint
```

## Architecture

Next.js (App Router) full-stack monolith. Business logic lives in framework-agnostic modules under `src/modules/{context}/` following Clean Architecture with DDD-style bounded contexts (domain / application / infrastructure / test). Every architectural, product and design decision is recorded in [`docs/adr`](./docs/adr/README.md); the product's mission and principles live in [`docs/product-vision.md`](./docs/product-vision.md).

## License & contributing

Open Knowledge is released under the [MIT license](./LICENSE.md). Code contributions are not accepted, but **ideas, suggestions and bug reports are very welcome as [issues](https://github.com/oegea/open-knowledge/issues)** — see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Philosophy

Knowledge takes the center. The interface disappears around it. Technology makes publishing simpler, AI helps structure knowledge without hiding where it came from — and the quality of the experience proves that an open, self-hostable, free tool conceived as a gift doesn't have to feel worse than a commercial product.

Someone deploys Open Knowledge. Publishes knowledge. Someone else walks in. And learns.
