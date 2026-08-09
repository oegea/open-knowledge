# Open Knowledge

**Publish what you know. Openly, beautifully, on your own terms.**

Open Knowledge turns a folder of Markdown and JSON into a polished course
library anyone in the world can study — no accounts required to learn, no
personal data collected, no platform in the middle. You curate the
knowledge; the app makes it feel like a first-class product: an elegant
catalog, an immersive study mode, exams with real feedback, thirteen
languages, dark mode, and a mobile experience that feels native.

It is open source (MIT), self-hostable, and conceived as a gift, not a
business. The learner is never the product.

## Create your library in minutes

Your content lives in a public git repository; the app renders it. No
database, no server state, nothing to maintain.

**1 — Scaffold your content repository** (one command, no dependencies):

```sh
curl -fsSL https://raw.githubusercontent.com/oegea/open-knowledge/main/scripts/init-content-repo.sh | sh -s my-library
```

You get a working example — course, exam, news post, about page — already
committed to a fresh git repository.

**2 — Push it to GitHub** (public):

```sh
cd my-library
git remote add origin git@github.com:<user>/my-library.git
git push -u origin main
```

**3 — Deploy the app once, pointing at your content.** On Vercel, click
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

Your library is live. From now on **git is your admin panel**: edit a file,
push, and the site updates within a minute. Each course is a small JSON file
plus one Markdown file per lesson — a format designed to be written by hand,
and equally pleasant to work on with an AI coding assistant (Claude Code,
Codex, OpenCode…): the scaffolded repository ships an `AGENTS.md` that
teaches the assistant every format, so it can help you draft, structure and
publish your material.

In this mode visitors browse, study and take exams anonymously — their
progress lives in their own browser. Details in
[ADR 0013](./docs/adr/0013-static-content-mode.md).

## What learners get

- **A public catalog** — search, language and category filters, and complete
  courses that can be studied without registering, in the spirit of open
  audit-style learning.
- **A study mode built for focus** — careful long-form typography,
  Markdown/audio/video materials in a deliberate pedagogical order, visual
  progress, continue-where-you-left-off.
- **Exams that teach** — after answering, learners see *why* an answer was
  right or wrong, not just a score. Question pools draw a random subset per
  attempt.
- **Thirteen languages** — Español, English, Français, Deutsch, Italiano,
  简体中文, Русский, Українська, Català, Galego, Euskara, Português, 日本語.
  Courses declare their language; the catalog filters by it.
- **Mobile first** — designed for phones and tablets before desktop, with
  app-like navigation, touch-sized controls and subtle animations. Light and
  dark themes.
- **Honesty about AI** — courses labeled as AI-assisted show it clearly, and
  bibliographies credit sources. AI structures knowledge here; it never
  hides where it came from.

## Want accounts, progress and certificates?

Run Open Knowledge in **database mode**: learners get pseudonymous
identities (a random handle like `Erudito#4821` plus a TOTP authenticator —
no email, no personal data, ever) that keep progress across devices, record
exam results server-side, and earn shareable course-completion certificates
with a downloadable PDF. You manage everything from a visual admin panel:
course editor, exam builder, media uploads, news, auxiliary pages, instance
settings and one-click full backups. The first account registered becomes
the administrator.

This mode is deliberately stateful — SQLite plus media on local disk, zero
external services — so it wants a machine with a persistent disk. That is
also the deployment with **no variable costs**: a fixed-price VPS cannot
surprise you with a bandwidth bill. On any small VPS (1 vCPU / 512 MB is
plenty), a Raspberry Pi or a home server:

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

## Philosophy

The Internet made it possible to distribute knowledge at universal scale.
AI now lets us structure, synthesize and translate it with an ease that was
unthinkable until recently. That can feed yet another content mill — or it
can power an open tool with which anyone curates knowledge and gives it
away.

Knowledge takes the center. The interface disappears around it. And the
quality of the experience proves that a free, self-hostable tool conceived
as a gift doesn't have to feel worse than a commercial product.

Someone deploys Open Knowledge. Publishes knowledge. Someone else walks in.
And learns.

The full mission and principles live in
[`docs/product-vision.md`](./docs/product-vision.md).

## Development

```bash
pnpm dev            # dev server on :3000
pnpm test           # unit + integration tests (Jest)
pnpm test:e2e       # end-to-end suite (Playwright: mobile / tablet / desktop)
pnpm lint
```

## Architecture

Next.js (App Router) full-stack monolith. Business logic lives in
framework-agnostic modules under `src/modules/{context}/` following Clean
Architecture with DDD-style bounded contexts (domain / application /
infrastructure / test). Every architectural, product and design decision is
recorded in [`docs/adr`](./docs/adr/README.md).

## License & contributing

Open Knowledge is released under the [MIT license](./LICENSE.md). Code
contributions are not accepted, but **ideas, suggestions and bug reports are
very welcome as [issues](https://github.com/oegea/open-knowledge/issues)** —
see [CONTRIBUTING.md](./CONTRIBUTING.md).
