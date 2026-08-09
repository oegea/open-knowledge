#!/bin/sh
# Scaffolds a content repository for Open Knowledge's static mode (ADR 0013).
# Pure POSIX sh, zero dependencies. Run it directly:
#
#   sh init-content-repo.sh my-library
#
# or straight from the app repository:
#
#   curl -fsSL https://raw.githubusercontent.com/oegea/open-knowledge/main/scripts/init-content-repo.sh | sh -s my-library
#
# The generated folder is the deployable format — publish it as a public git
# repository and point an Open Knowledge instance at its raw URL. No build step.
set -eu

TARGET="${1:-}"
if [ -z "$TARGET" ]; then
  echo "Usage: init-content-repo.sh <directory>" >&2
  exit 1
fi
if [ -e "$TARGET" ] && [ -n "$(ls -A "$TARGET" 2>/dev/null)" ]; then
  echo "Refusing to write into non-empty directory: $TARGET" >&2
  exit 1
fi

NOW="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
mkdir -p "$TARGET/courses" "$TARGET/news" "$TARGET/pages" "$TARGET/media"

say() { echo "  $1"; }
echo "Scaffolding static content library in $TARGET:"

# ---------------------------------------------------------------- settings
cat <<'EOF' > "$TARGET/settings.json"
{
  "libraryName": "My Open Knowledge Library",
  "ownerName": "",
  "logoPath": null,
  "certificateLogoPath": null,
  "documentLogoPath": null,
  "heroTitle": "",
  "heroText": "",
  "heroImagePath": null,
  "registrationOpen": false,
  "newsEnabled": true
}
EOF
say settings.json

# ----------------------------------------------------------------- courses
cat <<'EOF' > "$TARGET/courses/index.json"
[
  "getting-started"
]
EOF
say courses/index.json

cat <<'EOF' | sed "s/@NOW@/$NOW/g" > "$TARGET/courses/getting-started.json"
{
  "id": "course-getting-started",
  "title": "Getting started with your static library",
  "slug": "getting-started-with-your-static-library",
  "description": "A sample course that shows how content is structured in a static Open Knowledge library. Edit it, copy it, or delete it.",
  "language": "en",
  "category": "Meta",
  "coverImage": "media/getting-started-cover.svg",
  "authors": ["Your name here"],
  "sources": [
    { "title": "Open Knowledge documentation", "url": "https://github.com/oegea/open-knowledge" }
  ],
  "license": "CC BY-SA 4.0",
  "aiAssisted": false,
  "published": true,
  "createdAt": "@NOW@",
  "updatedAt": "@NOW@",
  "sections": [
    {
      "id": "section-basics",
      "title": "The basics",
      "materials": [
        {
          "id": "material-structure",
          "title": "How this repository is structured",
          "type": "markdown",
          "markdown": "Everything your library serves lives in this repository:\n\n- `settings.json` — the library name and site configuration.\n- `courses/index.json` — which courses exist and their catalog order.\n- `courses/<name>.json` — one file per course, sections and materials inline.\n- `news/index.json` — news posts, newest first.\n- `pages/index.json` — auxiliary pages (about, legal…).\n- `media/` — images referenced with relative paths like `media/cover.svg`.\n\nEdit a file, push, and the library updates within a minute. **No accounts exist in this mode** — visitors study anonymously and their progress stays in their own browser.",
          "mediaPath": null,
          "exam": null,
          "required": true,
          "sources": []
        },
        {
          "id": "material-exam",
          "title": "Check what you learned",
          "type": "exam",
          "markdown": "",
          "mediaPath": null,
          "exam": {
            "passingScore": 0.5,
            "questionsPerAttempt": 2,
            "questions": [
              {
                "id": "q-source-of-truth",
                "text": "Where does a static Open Knowledge library read its content from?",
                "choices": [
                  { "id": "a", "text": "A SQLite database on the server" },
                  { "id": "b", "text": "A public content repository over HTTP" },
                  { "id": "c", "text": "A commercial CMS" }
                ],
                "correctChoiceId": "b",
                "explanation": "In static mode the container is stateless: it renders JSON and media fetched from the public content repository."
              },
              {
                "id": "q-publishing",
                "text": "How do you publish a change?",
                "choices": [
                  { "id": "a", "text": "Through an admin panel" },
                  { "id": "b", "text": "By pushing to the content repository" },
                  { "id": "c", "text": "By redeploying the container" }
                ],
                "correctChoiceId": "b",
                "explanation": "Git is the admin panel here: edit, commit, push. The instance picks it up on the next cache refresh."
              }
            ]
          },
          "required": true,
          "sources": []
        }
      ]
    }
  ]
}
EOF
say courses/getting-started.json

# -------------------------------------------------------------------- news
cat <<'EOF' | sed "s/@NOW@/$NOW/g" > "$TARGET/news/index.json"
[
  {
    "id": "news-welcome",
    "title": "This library is live",
    "slug": "this-library-is-live",
    "markdown": "Welcome! This library runs **Open Knowledge in static mode**: its content lives in a public git repository, and this post is just a JSON entry in `news/index.json`.",
    "imagePath": null,
    "author": "",
    "published": true,
    "createdAt": "@NOW@",
    "updatedAt": "@NOW@"
  }
]
EOF
say news/index.json

# ------------------------------------------------------------------- pages
cat <<'EOF' | sed "s/@NOW@/$NOW/g" > "$TARGET/pages/index.json"
[
  {
    "id": "page-about",
    "title": "About this library",
    "slug": "about",
    "markdown": "This knowledge library is powered by **Open Knowledge**, an open-source application released under the MIT license that lets anyone publish courses openly — as a gift, not a business.\n\nIt collects no personal data from its visitors.\n\nOpen Knowledge is an open-source project: [github.com/oegea/open-knowledge](https://github.com/oegea/open-knowledge).",
    "placement": "footer",
    "position": 0,
    "createdAt": "@NOW@",
    "updatedAt": "@NOW@"
  }
]
EOF
say pages/index.json

# ------------------------------------------------------------------- media
cat <<'EOF' > "$TARGET/media/getting-started-cover.svg"
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0e7c86"/><stop offset="1" stop-color="#12424a"/></linearGradient></defs><rect width="1280" height="720" fill="url(#g)"/><circle cx="1050" cy="170" r="80" fill="#f0a92e" opacity="0.9"/><path d="M540 300c-40-30-95-40-140-32v180c45-8 100 2 140 32 40-30 95-40 140-32V268c-45-8-100 2-140 32z" fill="none" stroke="#fff" stroke-width="18" stroke-linejoin="round"/><path d="M540 300v180" stroke="#fff" stroke-width="18" stroke-linecap="round"/></svg>
EOF
say media/getting-started-cover.svg

# ---------------------------------------------------------------- CLAUDE.md
cat <<'EOF' > "$TARGET/CLAUDE.md"
@AGENTS.md
EOF
say CLAUDE.md

# ---------------------------------------------------------------- AGENTS.md
cat <<'EOF' > "$TARGET/AGENTS.md"
# This repository IS a knowledge library

This is a **content repository** for [Open Knowledge](https://github.com/oegea/open-knowledge),
an open-source, self-hostable application that publishes course libraries. An
Open Knowledge instance in *static content mode* reads everything it serves
straight from this repository over HTTP. There is no build step and no
database: **editing these files and pushing IS publishing**. Changes go live
within about a minute (the instance caches content for 60 seconds).

When in doubt about any format detail, the application source is open —
consult it at https://github.com/oegea/open-knowledge. The JSON shapes used
here are exactly the domain primitives under `src/modules/*/domain/*.ts`
(look for the `XPrimitive` interfaces and their `fromPrimitive` validation).

## Ground rules

- Every file must stay **valid JSON** (double quotes, no trailing commas, no
  comments). A malformed file makes that content disappear from the site
  until fixed.
- `id` values must be unique within their file and **must never change** once
  published: visitor progress is keyed by course and material ids, and
  changing them resets everyone's progress.
- `slug` values are the public URLs (`/courses/<slug>`, `/news/<slug>`,
  `/p/<slug>`): lowercase, hyphen-separated, unique per content type. Prefer
  keeping them stable; if you must rename one, old links break (static mode
  has no redirect memory).
- Dates are ISO 8601 UTC strings, e.g. `"2026-08-09T12:00:00Z"`.
- Markdown fields support standard Markdown: headings, lists, links, images,
  code blocks, tables.
- Images live in `media/` and are referenced with repo-relative paths like
  `"media/my-image.jpg"`. Absolute `https://` URLs also work.

## Adding a course

1. Create `courses/<name>.json` (the `<name>` is just a file name; the public
   URL comes from the `slug` field inside).
2. Append `"<name>"` to the array in `courses/index.json` — its position sets
   the catalog order. A course not listed in the index does not exist.

Course file shape (every key is required unless noted):

```json
{
  "id": "course-unique-id",
  "title": "Course title",
  "slug": "course-title",
  "description": "One or two sentences shown in the catalog card and detail page.",
  "language": "en",
  "category": "Science",
  "coverImage": "media/my-cover.jpg",
  "authors": ["Author Name"],
  "sources": [
    { "title": "A book or reference", "url": null },
    { "title": "A website", "url": "https://example.org" }
  ],
  "license": "CC BY-SA 4.0",
  "aiAssisted": false,
  "published": true,
  "createdAt": "2026-08-09T12:00:00Z",
  "updatedAt": "2026-08-09T12:00:00Z",
  "sections": [ ... ]
}
```

Field notes:

- `language`: one of `es en fr de it zh ru uk ca gl eu pt ja`. The catalog
  filters by it.
- `category`: free text or `null`. Courses sharing a category get a filter chip.
- `coverImage`: required in practice — the catalog is visual. 16:9 works best.
- `sources`: the bibliography shown on the course page. `url` may be `null`
  for offline references (books).
- `license`: free text shown on the course page (e.g. `"CC BY-SA 4.0"`), or
  `null` to omit.
- `aiAssisted`: set `true` if AI helped produce the materials — the course
  will show a clear notice. Open Knowledge is deliberately transparent about
  this; do not hide it.
- `published`: `false` keeps the course out of the catalog entirely (static
  mode has no admin preview, so unpublished courses are simply invisible).

### Sections and materials

`sections` is an ordered array; each section is a logical chunk of the course
and contains ordered `materials` — the order is the pedagogical path visitors
follow:

```json
{
  "id": "section-1",
  "title": "First section",
  "materials": [ ... ]
}
```

Every material shares this envelope:

```json
{
  "id": "material-unique-id",
  "title": "Material title",
  "type": "markdown",
  "markdown": "...",
  "mediaPath": null,
  "exam": null,
  "required": true,
  "sources": []
}
```

- `required`: required materials count towards course completion.
- `sources`: optional per-material bibliography, same shape as the course's.

The four material types:

1. **`"type": "markdown"`** — a text lesson. Put the content in `markdown`
   (do not repeat the title as a heading; the app already renders it).
   `mediaPath` and `exam` stay `null`.
2. **`"type": "video"`** — set `mediaPath` to a video file (`media/lesson.mp4`
   or an absolute URL). `markdown` may hold optional notes rendered below the
   player.
3. **`"type": "audio"`** — same as video with an audio file (`media/talk.mp3`).
   The player shows the course artwork.
4. **`"type": "exam"`** — set `exam` to:

```json
{
  "passingScore": 0.7,
  "questionsPerAttempt": 5,
  "questions": [
    {
      "id": "q1",
      "text": "The question?",
      "choices": [
        { "id": "a", "text": "First choice" },
        { "id": "b", "text": "Second choice" }
      ],
      "correctChoiceId": "b",
      "explanation": "Shown after answering — explain WHY, don't just grade."
    }
  ]
}
```

- `passingScore` is a ratio (0.7 = 70%).
- `questionsPerAttempt`: how many questions each attempt draws randomly from
  the pool — a bank of 50 questions with `questionsPerAttempt: 10` gives
  every visitor a different exam. Use the pool size to ask everything.
- Write real `explanation`s: the product's exam philosophy is feedback, not
  scores.

## Adding a news post

Prepend an object to the array in `news/index.json` (newest first):

```json
{
  "id": "news-unique-id",
  "title": "Post title",
  "slug": "post-title",
  "markdown": "Body in **Markdown**.",
  "imagePath": "media/featured.jpg",
  "author": "Editor Name",
  "published": true,
  "createdAt": "2026-08-09T12:00:00Z",
  "updatedAt": "2026-08-09T12:00:00Z"
}
```

`imagePath` (featured image) and `author` (byline next to the date) are
optional — use `null` / `""`. The newest post renders as a large featured
story. News can be disabled site-wide via `newsEnabled` in `settings.json`.

## Adding an auxiliary page

Add an object to `pages/index.json`:

```json
{
  "id": "page-unique-id",
  "title": "Page title",
  "slug": "page-title",
  "markdown": "Body in **Markdown**.",
  "placement": "menu",
  "position": 1,
  "createdAt": "2026-08-09T12:00:00Z",
  "updatedAt": "2026-08-09T12:00:00Z"
}
```

`placement` decides where the page is linked: `"menu"` (header navigation),
`"footer"` (footer links) or `"hidden"` (reachable only by URL). `position`
orders pages within their placement.

## Site identity: name, texts, logos

Everything lives in `settings.json`:

- `libraryName` — the site name, browser-tab title and header brand.
- `ownerName` — shown in the footer as "This library belongs to X…". Empty
  string hides the ownership part.
- `heroTitle` / `heroText` — the home headline and subtitle. Empty strings
  fall back to localized defaults.
- `heroImagePath` — optional home hero background image (e.g.
  `"media/hero.jpg"`); `null` shows an animated brand gradient instead.
- `logoPath` — header logo image; `null` shows the library name as text.
- `documentLogoPath` — logo used inside exported EPUB/PDF documents; falls
  back to `logoPath`.
- `certificateLogoPath` — irrelevant in static mode (no certificates).
- `newsEnabled` — `false` removes the news section entirely.
- `registrationOpen` — ignored in static mode; there are no accounts.

To change a logo: drop the image into `media/` and set the path. SVG, PNG,
JPEG and WebP all work in the UI; PNG/JPEG reproduce best inside exported
PDFs.

## What does NOT exist in static mode

No accounts, no registration, no login, no notifications, no certificates,
no admin panel. Visitors study anonymously; their progress stays in their own
browser. If you need those features, run Open Knowledge in its default
database mode instead (see the application README).
EOF
say AGENTS.md

# --------------------------------------------------------------- README.md
cat <<'EOF' > "$TARGET/README.md"
# My Open Knowledge library (static content)

This repository IS the library: an [Open Knowledge](https://github.com/oegea/open-knowledge)
instance in **static content mode** reads everything it serves from here.
Editing these files and pushing is publishing — no build, no deploy, no
database. `AGENTS.md` documents every format in detail (and makes AI coding
assistants like Claude Code fluent in this repository: try asking one to
"add a course about X").

## Publish the library in three steps

1. **Push this folder** to a public GitHub repository.
2. **Deploy the Open Knowledge app** (once) with the environment variable
   `OK_CONTENT_REPO` pointing at this repository's raw URL:
   `https://raw.githubusercontent.com/<user>/<repo>/main`
3. **Edit, commit, push** to publish content from now on. Changes appear
   within a minute.

### Deploy option A — Vercel (no server at all)

The app is stateless in this mode, so a serverless platform works. Click:

> https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Foegea%2Fopen-knowledge&env=OK_CONTENT_REPO&envDescription=Raw%20base%20URL%20of%20your%20content%20repository

…and when asked, set `OK_CONTENT_REPO` to your raw URL from step 2.

### Deploy option B — any machine with Docker

```sh
git clone https://github.com/oegea/open-knowledge.git && cd open-knowledge
docker build -t open-knowledge .
docker run -d --name open-knowledge --restart unless-stopped -p 3000:3000 \
  -e OK_CONTENT_REPO=https://raw.githubusercontent.com/<user>/<repo>/main \
  open-knowledge
```

### Deploy option C — container platforms

The same image runs on Railway, Render, Fly.io and friends. No volume is
needed — the container is stateless and disposable.

## Structure

| Path | What it is |
|------|------------|
| `settings.json` | Library name, hero texts, logos, news toggle |
| `courses/index.json` | Course file names, in catalog order |
| `courses/<name>.json` | A full course: metadata, sections, materials, exams |
| `news/index.json` | News posts, newest first |
| `pages/index.json` | Auxiliary pages (menu, footer or hidden) |
| `media/` | Images and files, referenced as `media/<file>` |

In this mode there are no accounts: visitors study anonymously and their
progress lives in their own browser.
EOF
say README.md

echo ""
echo "Done. Next steps:"
echo "  1. cd $TARGET && git init && git add -A && git commit -m 'My library'"
echo "  2. Publish it as a PUBLIC repository on GitHub."
echo "  3. Deploy Open Knowledge with OK_CONTENT_REPO set to the repo's raw URL"
echo "     (see README.md inside $TARGET for one-click and Docker options)."
