# Open Knowledge

**An open, self-hosted library of knowledge.** Deploy your own instance, curate and publish courses, and offer them openly to anyone who wants to learn.

In a world where AI lets us distill knowledge at a scale that used to be unthinkable, Open Knowledge is the open tool to organize that knowledge, publish it, and offer it to others — as a gift, not a business. The learner is not a product: no names, no emails, no profiles. If someone just wants to read, they can. If they want to keep their progress, they get a pseudonymous identity and nothing more.

## How to deploy your library

The fastest way to have a library online is **static content mode**: your
content lives in a public git repository, the app just renders it, and no
server, database or volume is needed.

1. **Create your content repository** — one command, no dependencies:

   ```sh
   curl -fsSL https://raw.githubusercontent.com/oegea/open-knowledge/main/scripts/init-content-repo.sh | sh -s my-library
   ```

   It scaffolds an example course, news post and about page, and initializes
   the git repository with a first commit.

2. **Push it to GitHub** (public):

   ```sh
   cd my-library
   git remote add origin git@github.com:<user>/my-library.git
   git push -u origin main
   ```

3. **Deploy the app once**, pointing it at your content. On Vercel, click
   [Deploy](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Foegea%2Fopen-knowledge&env=OK_CONTENT_REPO&envDescription=Raw%20base%20URL%20of%20your%20content%20repository)
   and set `OK_CONTENT_REPO` to `https://raw.githubusercontent.com/<user>/my-library/main`.
   Or on any machine with Docker:

   ```sh
   git clone https://github.com/oegea/open-knowledge.git && cd open-knowledge
   docker build -t open-knowledge .
   docker run -d -p 3000:3000 \
     -e OK_CONTENT_REPO=https://raw.githubusercontent.com/<user>/my-library/main \
     open-knowledge
   ```

That's it. From now on **git is your admin panel**: edit a file, push, and
the library updates within a minute. The scaffolded repository includes an
`AGENTS.md`/`CLAUDE.md` pair that teaches AI coding assistants every content
format — open Claude Code inside it and ask for "a course about X".

In static mode visitors browse, study and take exams anonymously (progress
stays in their browser). There are no accounts of any kind. Details in
[ADR 0013](./docs/adr/0013-static-content-mode.md).

## Deploying with accounts (database mode)

If you want learners to **keep progress across devices, record exam results
and earn certificates** — and you'd rather manage content through a visual
admin panel than through git — run Open Knowledge in its default database
mode. It is deliberately stateful (SQLite + media on local disk, zero
external services), so it wants a machine with a persistent disk. That is
also the deployment with **no variable costs**: a fixed-price VPS cannot
surprise you with a bandwidth bill.

On any small VPS (1 vCPU / 512 MB is plenty), a Raspberry Pi or a home
server:

```bash
git clone https://github.com/oegea/open-knowledge.git && cd open-knowledge
docker build -t open-knowledge .
docker run -d --name open-knowledge --restart unless-stopped \
  -p 3000:3000 -v ok_data:/data open-knowledge
```

Put a reverse proxy in front (Caddy makes HTTPS one line:
`caddy reverse-proxy --from your-domain.example --to :3000`), open the URL
and **register the first account — it becomes the administrator**; guard its
recovery code.

- **Upgrades**: `git pull`, rebuild, recreate the container with the same
  `-v ok_data:/data`. Migrations are automatic and additive.
- **Backups**: copy the volume, or use the admin panel's one-click
  environment backup zip (restores onto any fresh instance).
- **Container platforms** (Fly.io, Railway, Render) also work: mount a
  persistent volume at `/data` and keep exactly one instance (SQLite wants a
  single writer). Mind that usage-based platforms rarely offer hard spending
  caps.
- Running without Docker is just `pnpm install && pnpm build && pnpm start`
  (Node 20+); state lives in `./data`, relocatable with `OK_DATA_DIR`.

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
