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
mkdir -p "$TARGET/courses/getting-started/materials" "$TARGET/categories" "$TARGET/news" "$TARGET/pages" "$TARGET/media"

say() { echo "  $1"; }
echo "Scaffolding static content library in $TARGET:"

# ---------------------------------------------------------------- settings
cat <<'EOF' > "$TARGET/settings.json"
{
  "libraryName": "My Open Knowledge Library",
  "ownerName": "",
  "logoPath": null,
  "logoDarkPath": null,
  "invertLogoInDarkMode": false,
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

cat <<'EOF' | sed "s/@NOW@/$NOW/g" > "$TARGET/courses/getting-started/course.json"
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
          "markdownFile": "materials/how-this-repository-is-structured.md",
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
                "explanation": "In static mode the container is stateless: it renders JSON, Markdown and media fetched from the public content repository."
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
say courses/getting-started/course.json

cat <<'EOF' > "$TARGET/courses/getting-started/materials/how-this-repository-is-structured.md"
Everything your library serves lives in this repository, one file per thing:

- `settings.json` — the library name and site configuration.
- `courses/index.json` — which courses exist and their catalog order.
- `courses/<name>/course.json` — one course: metadata, sections, materials.
- `courses/<name>/materials/*.md` — each text lesson is its own Markdown file.
- `categories/<name>.json` — an optional card image for a course category.
- `news/<name>.json` + `news/<name>.md` — one news post each.
- `pages/<name>.json` + `pages/<name>.md` — one auxiliary page each.
- `media/` — images referenced with relative paths like `media/cover.svg`.

Edit a file, push, and the library updates within a minute. **No accounts
exist in this mode** — visitors study anonymously and their progress stays in
their own browser.
EOF
say courses/getting-started/materials/how-this-repository-is-structured.md

# -------------------------------------------------------------- categories
cat <<'EOF' > "$TARGET/categories/index.json"
[
  "meta"
]
EOF
say categories/index.json

cat <<'EOF' | sed "s/@NOW@/$NOW/g" > "$TARGET/categories/meta.json"
{
  "id": "category-meta",
  "name": "Meta",
  "imagePath": "media/category-meta.svg",
  "createdAt": "@NOW@",
  "updatedAt": "@NOW@"
}
EOF
say categories/meta.json

# -------------------------------------------------------------------- news
cat <<'EOF' > "$TARGET/news/index.json"
[
  "this-library-is-live"
]
EOF
say news/index.json

cat <<'EOF' | sed "s/@NOW@/$NOW/g" > "$TARGET/news/this-library-is-live.json"
{
  "id": "news-welcome",
  "title": "This library is live",
  "slug": "this-library-is-live",
  "markdownFile": "this-library-is-live.md",
  "imagePath": null,
  "author": "",
  "published": true,
  "createdAt": "@NOW@",
  "updatedAt": "@NOW@"
}
EOF
say news/this-library-is-live.json

cat <<'EOF' > "$TARGET/news/this-library-is-live.md"
Welcome! This library runs **Open Knowledge in static mode**: its content
lives in a public git repository, and this post is a small JSON descriptor
plus this Markdown file.
EOF
say news/this-library-is-live.md

# ------------------------------------------------------------------- pages
cat <<'EOF' > "$TARGET/pages/index.json"
[
  "about"
]
EOF
say pages/index.json

cat <<'EOF' | sed "s/@NOW@/$NOW/g" > "$TARGET/pages/about.json"
{
  "id": "page-about",
  "title": "About this library",
  "slug": "about",
  "markdownFile": "about.md",
  "placement": "footer",
  "position": 0,
  "createdAt": "@NOW@",
  "updatedAt": "@NOW@"
}
EOF
say pages/about.json

cat <<'EOF' > "$TARGET/pages/about.md"
This knowledge library is powered by **Open Knowledge**, an open-source
application released under the MIT license that lets anyone publish courses
openly — as a gift, not a business.

It collects no personal data from its visitors.

Open Knowledge is an open-source project:
[github.com/oegea/open-knowledge](https://github.com/oegea/open-knowledge).
EOF
say pages/about.md

# ------------------------------------------------------------------- media
cat <<'EOF' > "$TARGET/media/getting-started-cover.svg"
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0e7c86"/><stop offset="1" stop-color="#12424a"/></linearGradient></defs><rect width="1280" height="720" fill="url(#g)"/><circle cx="1050" cy="170" r="80" fill="#f0a92e" opacity="0.9"/><path d="M540 300c-40-30-95-40-140-32v180c45-8 100 2 140 32 40-30 95-40 140-32V268c-45-8-100 2-140 32z" fill="none" stroke="#fff" stroke-width="18" stroke-linejoin="round"/><path d="M540 300v180" stroke="#fff" stroke-width="18" stroke-linecap="round"/></svg>
EOF
say media/getting-started-cover.svg

cat <<'EOF' > "$TARGET/media/category-meta.svg"
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#12424a"/><stop offset="1" stop-color="#0e7c86"/></linearGradient></defs><rect width="1280" height="720" fill="url(#g)"/><circle cx="230" cy="560" r="90" fill="#f0a92e" opacity="0.85"/><path d="M760 220h240a40 40 0 0 1 40 40v200a40 40 0 0 1-40 40H760l-120-140z" fill="none" stroke="#fff" stroke-width="18" stroke-linejoin="round"/><circle cx="800" cy="360" r="16" fill="#fff"/></svg>
EOF
say media/category-meta.svg

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
(the `XPrimitive` interfaces and their `fromPrimitive` validation), and the
loaders live in `src/modules/*/infrastructure/Static*Repository.ts`.

## Layout: one file per thing

```
settings.json                        site identity and configuration
courses/index.json                   course directory names, catalog order
courses/<name>/course.json           one course (metadata + structure)
courses/<name>/materials/<file>.md   one Markdown file per text lesson
categories/index.json                category entry names
categories/<name>.json               one category card (name + image)
news/index.json                      news entry names, newest first
news/<name>.json  +  news/<name>.md  one news post each
pages/index.json                     page entry names
pages/<name>.json + pages/<name>.md  one auxiliary page each
media/                               images and files
```

Long-form text NEVER lives inside JSON: descriptors reference a Markdown
file through the `markdownFile` field (a path relative to the descriptor's
directory). That keeps JSON small and structural, and prose editable as
plain Markdown.

## Ground rules

- Every `.json` file must stay **valid JSON** (double quotes, no trailing
  commas, no comments). A malformed file makes that content disappear from
  the site until fixed.
- `id` values must be unique within their content type and **must never
  change** once published: visitor progress is keyed by course and material
  ids, and changing them resets everyone's progress.
- `slug` values are the public URLs (`/courses/<slug>`, `/news/<slug>`,
  `/p/<slug>`): lowercase, hyphen-separated, unique per content type. Keep
  them stable; renaming one breaks old links (static mode has no redirects).
- An item not listed in its `index.json` does not exist, no matter what
  files are on disk. Index order is display order (courses: catalog order;
  news: newest first).
- Dates are ISO 8601 UTC strings, e.g. `"2026-08-09T12:00:00Z"`.
- Markdown supports headings, lists, links, images, code blocks and tables.
- Images live in `media/` and are referenced with repo-relative paths like
  `"media/my-image.jpg"`. Absolute `https://` URLs also work.

## Adding a course

1. Create the directory `courses/<name>/` with a `course.json` and a
   `materials/` folder for its text lessons.
2. Append `"<name>"` to `courses/index.json`.

`course.json` shape:

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
  "sections": [
    {
      "id": "section-1",
      "title": "First section",
      "materials": []
    }
  ]
}
```

Field notes:

- `language`: one of `es en fr de it zh ru uk ca gl eu pt ja`. The catalog
  filters by it.
- `category`: free text or `null`. Courses sharing a category get a filter
  chip, and every category with at least one published course gets a card on
  the home page. To give that card an image, add a category entry (see
  "Adding a category" below) — without one the card shows an auto-generated
  gradient.
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

### Materials

`sections` is an ordered array; each section contains ordered `materials` —
the order is the pedagogical path visitors follow. Every material shares
this envelope:

```json
{
  "id": "material-unique-id",
  "title": "Material title",
  "type": "markdown",
  "markdownFile": "materials/my-lesson.md",
  "mediaPath": null,
  "exam": null,
  "required": true,
  "sources": []
}
```

- `required`: required materials count towards course completion.
- `sources`: optional per-material bibliography, same shape as the course's.

The four material types:

1. **`"type": "markdown"`** — a text lesson. Write the content in a file
   under `materials/` and point `markdownFile` at it (path relative to the
   course directory). Don't repeat the title as a heading — the app renders
   it. `mediaPath` and `exam` stay `null`.
2. **`"type": "video"`** — set `mediaPath` to a video file
   (`media/lesson.mp4` or an absolute URL). `markdownFile` may point to
   optional notes rendered below the player.
3. **`"type": "audio"`** — same as video with an audio file
   (`media/talk.mp3`). The player shows the course artwork.
   Audio and video materials may also set `"transcriptPath"` to a
   **timed transcript** JSON (`media/talk.transcript.json`): the study view
   then highlights each word as it is narrated and keeps it in view (see
   "Timed transcripts" below). Omit it or set `null` for plain playback.
4. **`"type": "exam"`** — keep the questions inline in `course.json` (they
   are structure, not prose). Set `exam` to:

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
  every visitor a different exam.
- Write real `explanation`s: the product's exam philosophy is feedback, not
  scores.

### Timed transcripts (narrated audio/video)

A timed transcript pairs a narrated `audio`/`video` material with the timing
of every spoken word, so the text below the player is highlighted karaoke-
style while it plays. It is a plain JSON file referenced by the material's
`transcriptPath`:

```json
{
  "words": [
    { "text": "El", "start": 0.06, "end": 0.16 },
    { "text": "agua", "start": 0.2, "end": 0.38 },
    { "text": "empezó", "start": 0.39, "end": 0.7 }
  ]
}
```

- `text`: the word as spoken, punctuation included; `start`/`end` in seconds,
  in order. Any speech tool that produces word timestamps (forced alignment,
  TTS with timestamps) can generate it.
- The transcript is aligned in the browser against the words of the
  material's Markdown, so both must come from the same text; small
  differences (Markdown syntax, images, a sentence not narrated) are
  tolerated. If they diverge too much, the material simply plays without
  highlighting — a transcript never breaks a course.
- Exports (PDF/EPUB/Markdown) ignore it. The content host must allow
  cross-origin reads of the JSON (GitHub raw URLs do).

## Adding a category

Categories are derived from the courses themselves: any `category` string
used by a published course appears on the home page as a card and in the
catalog as a filter chip. A category *entry* is optional decoration — it
attaches a card image to one of those names:

1. Create `categories/<name>.json`.
2. Add `"<name>"` to `categories/index.json`.

```json
{
  "id": "category-unique-id",
  "name": "Science",
  "imagePath": "media/category-science.jpg",
  "createdAt": "2026-08-09T12:00:00Z",
  "updatedAt": "2026-08-09T12:00:00Z"
}
```

- `name` must match the courses' `category` string **exactly**
  (case-sensitive) — the association is by name.
- `imagePath`: the home page card image, 16:9 works best. `null` falls back
  to the auto-generated gradient card.
- An entry whose name no published course uses shows nothing — cards only
  exist for categories with at least one published course.

## Adding a news post

1. Create `news/<name>.json` and `news/<name>.md` (the body).
2. **Prepend** `"<name>"` to `news/index.json` — the list is newest first,
   and the first entry renders as the large featured story.

```json
{
  "id": "news-unique-id",
  "title": "Post title",
  "slug": "post-title",
  "markdownFile": "post-title.md",
  "imagePath": "media/featured.jpg",
  "author": "Editor Name",
  "published": true,
  "createdAt": "2026-08-09T12:00:00Z",
  "updatedAt": "2026-08-09T12:00:00Z"
}
```

`imagePath` (featured image) and `author` (byline next to the date) are
optional — use `null` / `""`. News can be disabled site-wide via
`newsEnabled` in `settings.json`.

## Adding an auxiliary page

1. Create `pages/<name>.json` and `pages/<name>.md`.
2. Add `"<name>"` to `pages/index.json`.

```json
{
  "id": "page-unique-id",
  "title": "Page title",
  "slug": "page-title",
  "markdownFile": "page-title.md",
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
- `logoDarkPath` — optional header logo for the dark theme; `null` falls
  back to `logoPath`.
- `invertLogoInDarkMode` — `true` shows `logoPath` with inverted colors
  while the dark theme is active and no `logoDarkPath` is set — handy when a
  single logo was designed for light backgrounds. Default `false`.
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
database. `AGENTS.md` documents every format in detail, and doubles as
instructions for AI coding assistants (Claude Code, Codex, OpenCode…), so
one can assist you in drafting, structuring and publishing your material
directly in this repository.

## Publish the library in three steps

1. **Push this folder** to a public GitHub repository (the scaffolder
   already ran `git init` and made the first commit):

   ```sh
   git remote add origin git@github.com:<user>/<repo>.git
   git push -u origin main
   ```

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

One file per thing; long-form text lives in Markdown, never inside JSON:

| Path | What it is |
|------|------------|
| `settings.json` | Library name, hero texts, logos, news toggle |
| `courses/index.json` | Course directory names, in catalog order |
| `courses/<name>/course.json` | One course: metadata, sections, materials, exams |
| `courses/<name>/materials/*.md` | One Markdown file per text lesson |
| `categories/<name>.json` | Optional card image per category, listed in `categories/index.json` |
| `news/<name>.json` + `.md` | One news post each, listed in `news/index.json` |
| `pages/<name>.json` + `.md` | One auxiliary page each, listed in `pages/index.json` |
| `media/` | Images and files, referenced as `media/<file>` |

In this mode there are no accounts: visitors study anonymously and their
progress lives in their own browser.
EOF
say README.md

# ---------------------------------------------------------------- git init
if command -v git >/dev/null 2>&1; then
  (
    cd "$TARGET"
    git init -q -b main 2>/dev/null || git init -q
    git add -A
    git commit -q -m "My Open Knowledge library" 2>/dev/null || true
  )
  say "git repository initialized (branch main, first commit done)"
else
  echo "  (git not found — initialize the repository yourself when ready)"
fi

echo ""
echo "Done. Your library lives in: $TARGET"
echo ""
echo "Next steps:"
echo ""
echo "  1. Create a PUBLIC repository on GitHub, then connect and push:"
echo "       cd $TARGET"
echo "       git remote add origin git@github.com:<user>/<repo>.git"
echo "       git push -u origin main"
echo ""
echo "  2. Deploy the Open Knowledge app pointing at your content"
echo "     (one-click Vercel button and Docker recipe in $TARGET/README.md)."
echo ""
echo "  3. Add content by editing the files directly — or open an AI coding"
echo "     assistant (Claude Code, Codex, OpenCode…) inside $TARGET to help"
echo "     you draft, structure and publish your material. AGENTS.md teaches"
echo "     it every format."
