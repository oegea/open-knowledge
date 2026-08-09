#!/usr/bin/env node
/**
 * Scaffolds a content repository for Open Knowledge's static mode (ADR 0013):
 *
 *   node scripts/init-content-repo.mjs my-library
 *
 * The generated folder is the deployable format — publish it as a public git
 * repository and point a container at its raw URL. No build step.
 */
import fs from 'node:fs';
import path from 'node:path';

const target = process.argv[2];
if (!target) {
  console.error('Usage: node scripts/init-content-repo.mjs <directory>');
  process.exit(1);
}
const root = path.resolve(target);
if (fs.existsSync(root) && fs.readdirSync(root).length > 0) {
  console.error(`Refusing to write into non-empty directory: ${root}`);
  process.exit(1);
}

const now = new Date().toISOString();

const settings = {
  libraryName: 'My Open Knowledge Library',
  ownerName: '',
  logoPath: null,
  certificateLogoPath: null,
  documentLogoPath: null,
  heroTitle: '',
  heroText: '',
  heroImagePath: null,
  registrationOpen: false,
  newsEnabled: true,
};

const course = {
  id: 'course-getting-started',
  title: 'Getting started with your static library',
  slug: 'getting-started-with-your-static-library',
  description:
    'A sample course that shows how content is structured in a static Open Knowledge library. Edit it, copy it, or delete it.',
  language: 'en',
  category: 'Meta',
  coverImage: 'media/getting-started-cover.svg',
  authors: ['Your name here'],
  sources: [{ title: 'Open Knowledge documentation', url: 'https://github.com/oegea/open-knowledge' }],
  license: 'CC BY-SA 4.0',
  aiAssisted: false,
  published: true,
  createdAt: now,
  updatedAt: now,
  sections: [
    {
      id: 'section-basics',
      title: 'The basics',
      materials: [
        {
          id: 'material-structure',
          title: 'How this repository is structured',
          type: 'markdown',
          markdown:
            'Everything your library serves lives in this repository:\n\n- `settings.json` — the library name and site configuration.\n- `courses/index.json` — which courses exist and their catalog order.\n- `courses/<name>.json` — one file per course, sections and materials inline.\n- `news/index.json` — news posts, newest first.\n- `pages/index.json` — auxiliary pages (about, legal…).\n- `media/` — images referenced with relative paths like `media/cover.svg`.\n\nEdit a file, push, and the library updates within a minute. **No accounts exist in this mode** — visitors study anonymously and their progress stays in their own browser.',
          mediaPath: null,
          exam: null,
          required: true,
          sources: [],
        },
        {
          id: 'material-exam',
          title: 'Check what you learned',
          type: 'exam',
          markdown: '',
          mediaPath: null,
          exam: {
            passingScore: 0.5,
            questionsPerAttempt: 2,
            questions: [
              {
                id: 'q-source-of-truth',
                text: 'Where does a static Open Knowledge library read its content from?',
                choices: [
                  { id: 'a', text: 'A SQLite database on the server' },
                  { id: 'b', text: 'A public content repository over HTTP' },
                  { id: 'c', text: 'A commercial CMS' },
                ],
                correctChoiceId: 'b',
                explanation:
                  'In static mode the container is stateless: it renders JSON and media fetched from the public content repository.',
              },
              {
                id: 'q-publishing',
                text: 'How do you publish a change?',
                choices: [
                  { id: 'a', text: 'Through an admin panel' },
                  { id: 'b', text: 'By pushing to the content repository' },
                  { id: 'c', text: 'By redeploying the container' },
                ],
                correctChoiceId: 'b',
                explanation:
                  'Git is the admin panel here: edit, commit, push. The instance picks it up on the next cache refresh.',
              },
            ],
          },
          required: true,
          sources: [],
        },
      ],
    },
  ],
};

const news = [
  {
    id: 'news-welcome',
    title: 'This library is live',
    slug: 'this-library-is-live',
    markdown:
      'Welcome! This library runs **Open Knowledge in static mode**: its content lives in a public git repository, and this post is just a JSON entry in `news/index.json`.',
    imagePath: null,
    author: '',
    published: true,
    createdAt: now,
    updatedAt: now,
  },
];

const pages = [
  {
    id: 'page-about',
    title: 'About this library',
    slug: 'about',
    markdown:
      'This knowledge library is powered by **Open Knowledge**, an open-source application released under the MIT license that lets anyone publish courses openly — as a gift, not a business.\n\nIt collects no personal data from its visitors.\n\nOpen Knowledge is an open-source project: [github.com/oegea/open-knowledge](https://github.com/oegea/open-knowledge).',
    placement: 'footer',
    position: 0,
    createdAt: now,
    updatedAt: now,
  },
];

const coverSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0e7c86"/><stop offset="1" stop-color="#12424a"/></linearGradient></defs><rect width="1280" height="720" fill="url(#g)"/><circle cx="1050" cy="170" r="80" fill="#f0a92e" opacity="0.9"/><path d="M540 300c-40-30-95-40-140-32v180c45-8 100 2 140 32 40-30 95-40 140-32V268c-45-8-100 2-140 32z" fill="none" stroke="#fff" stroke-width="18" stroke-linejoin="round"/><path d="M540 300v180" stroke="#fff" stroke-width="18" stroke-linecap="round"/></svg>`;

const readme = `# My Open Knowledge library (static content)

This repository IS the library: an [Open Knowledge](https://github.com/oegea/open-knowledge)
instance in **static content mode** reads everything it serves from here.

## Publish it

1. Push this repository to a **public** git host (e.g. GitHub).
2. Run the Open Knowledge Docker image pointing at the repository's raw URL:

\`\`\`bash
docker run -d --name open-knowledge --restart unless-stopped -p 3000:3000 \\
  -e OK_CONTENT_REPO=https://raw.githubusercontent.com/<user>/<repo>/main \\
  ghcr.io/oegea/open-knowledge   # or an image you built from the main repo
\`\`\`

No volume, no database: the container is stateless and disposable. Content
changes go live within a minute of \`git push\` — git is your admin panel.

## Structure

| Path | What it is |
|------|------------|
| \`settings.json\` | Library name, hero texts, logos, news toggle |
| \`courses/index.json\` | Course file names, in catalog order |
| \`courses/<name>.json\` | A full course: metadata, sections, materials, exams |
| \`news/index.json\` | News posts, newest first |
| \`pages/index.json\` | Auxiliary pages (\`placement\`: menu, footer or hidden) |
| \`media/\` | Images, referenced as \`media/<file>\` |

In this mode there are no accounts: visitors study anonymously and their
progress lives in their own browser.
`;

const write = (relative, content) => {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof content === 'string' ? content : JSON.stringify(content, null, 2) + '\n');
  console.log(`  ${relative}`);
};

console.log(`Scaffolding static content library in ${root}:`);
write('settings.json', settings);
write('courses/index.json', ['getting-started']);
write('courses/getting-started.json', course);
write('news/index.json', news);
write('pages/index.json', pages);
write('media/getting-started-cover.svg', coverSvg);
write('README.md', readme);
console.log('\nDone. Publish this folder as a public git repository and set');
console.log('OK_CONTENT_REPO to its raw base URL when running the Docker image.');
