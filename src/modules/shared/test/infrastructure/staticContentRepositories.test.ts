import { clearContentCache, getContentSourceUrl } from '../../infrastructure/StaticContentClient';
import { StaticCourseRepository } from '../../../course/infrastructure/StaticCourseRepository';
import { StaticNewsRepository } from '../../../news/infrastructure/StaticNewsRepository';
import { StaticPageRepository } from '../../../pages/infrastructure/StaticPageRepository';
import { StaticSettingsRepository } from '../../../settings/infrastructure/StaticSettingsRepository';
import * as CourseMother from '../../../course/test/helpers/CourseMother';
import * as NewsPostMother from '../../../news/test/helpers/NewsPostMother';

const BASE = 'https://raw.example/content/main';

/** Values may be JSON documents (objects/arrays) or plain text (strings). */
function mockContent(documents: Record<string, unknown>) {
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const relative = url.replace(`${BASE}/`, '');
    if (relative in documents) {
      const body = documents[relative];
      return typeof body === 'string'
        ? new Response(body, { status: 200 })
        : new Response(JSON.stringify(body), { status: 200, headers: { etag: `"${relative}"` } });
    }
    return new Response('not found', { status: 404 });
  }) as unknown as typeof fetch;
}

describe('static content repositories (unit)', () => {
  beforeEach(() => {
    process.env.OK_CONTENT_REPO = BASE;
    clearContentCache();
    jest.clearAllMocks();
  });

  afterAll(() => {
    delete process.env.OK_CONTENT_REPO;
  });

  it('loads a course from its directory, inlining markdownFile lessons', async () => {
    const primitive = CourseMother.createPrimitive({
      coverImage: 'media/cover.svg',
      published: true,
    });
    const [section] = primitive.sections;
    const [material] = section.materials;
    const raw = {
      ...primitive,
      sections: [
        {
          ...section,
          materials: [
            { ...material, markdown: '', markdownFile: 'materials/lesson.md' },
            {
              ...material,
              id: 'narrated',
              type: 'audio',
              markdown: '',
              markdownFile: 'materials/lesson.md',
              mediaPath: 'media/audio/lesson.mp3',
              transcriptPath: 'media/audio/lesson.transcript.json',
            },
            ...section.materials.slice(1),
          ],
        },
      ],
    };
    mockContent({
      'courses/index.json': ['astronomy'],
      'courses/astronomy/course.json': raw,
      'courses/astronomy/materials/lesson.md': 'Lesson body from a separate file.',
    });

    const repository = new StaticCourseRepository();
    const course = (await repository.findAll({ publishedOnly: true })).getCourses()[0];

    expect(course.getCoverImage()).toBe(`${BASE}/media/cover.svg`);
    const loaded = course.getSections().getSections()[0].getMaterials().getMaterials()[0];
    expect(loaded.getMarkdown()).toBe('Lesson body from a separate file.');
    const narrated = course.getSections().getSections()[0].getMaterials().getMaterialById('narrated')!;
    expect(narrated.getMediaPath()).toBe(`${BASE}/media/audio/lesson.mp3`);
    expect(narrated.getTranscriptPath()).toBe(`${BASE}/media/audio/lesson.transcript.json`);
    expect(await repository.findBySlug(course.getSlug())).not.toBeNull();
    expect(await repository.findById(primitive.id!)).not.toBeNull();
  });

  it('filters courses in memory and refuses writes', async () => {
    const es = { ...CourseMother.createPrimitive(), id: 'c1', slug: 'c1', language: 'es', published: true };
    const en = { ...CourseMother.createPrimitive(), id: 'c2', slug: 'c2', language: 'en', published: true };
    mockContent({
      'courses/index.json': ['c1', 'c2'],
      'courses/c1/course.json': es,
      'courses/c2/course.json': en,
    });

    const repository = new StaticCourseRepository();
    expect((await repository.findAll({ language: 'es' })).count()).toBe(1);
    await expect(repository.save()).rejects.toThrow('read-only');
    await expect(repository.delete()).rejects.toThrow('read-only');
  });

  it('loads news per file with external markdown, hiding drafts', async () => {
    mockContent({
      'news/index.json': ['live', 'draft'],
      'news/live.json': {
        ...NewsPostMother.create({ id: 'n1', slug: 'live', published: true }).toPrimitive(),
        markdown: '',
        markdownFile: 'live.md',
      },
      'news/live.md': 'Body from markdown file.',
      'news/draft.json': NewsPostMother.create({ id: 'n2', slug: 'draft', published: false }).toPrimitive(),
    });

    const published = await new StaticNewsRepository().findAll(true);
    expect(published.length).toBe(1);
    expect(published[0].getMarkdown()).toBe('Body from markdown file.');
  });

  it('loads pages per file, ordered by position', async () => {
    const base = { markdown: 'x', createdAt: '2026-08-09T00:00:00Z', updatedAt: '2026-08-09T00:00:00Z' };
    mockContent({
      'pages/index.json': ['about', 'legal'],
      'pages/about.json': { id: 'p1', title: 'About', slug: 'about', placement: 'footer', position: 1, ...base },
      'pages/legal.json': {
        id: 'p2',
        title: 'Legal',
        slug: 'legal',
        placement: 'footer',
        position: 0,
        ...base,
        markdown: '',
        markdownFile: 'legal.md',
      },
      'pages/legal.md': 'Legal body.',
    });

    const pages = await new StaticPageRepository().findByPlacement('footer');
    expect(pages.map((page) => page.getSlug())).toEqual(['legal', 'about']);
    expect(pages[0].getMarkdown()).toBe('Legal body.');
    expect(await new StaticPageRepository().findBySlug('about')).not.toBeNull();
  });

  it('forces registration closed and falls back to defaults without settings.json', async () => {
    mockContent({
      'settings.json': {
        libraryName: 'Static Library',
        registrationOpen: true,
        newsEnabled: true,
        logoPath: 'media/logo.svg',
        logoDarkPath: 'media/logo-dark.svg',
        invertLogoInDarkMode: true,
      },
    });

    const settings = await new StaticSettingsRepository().get();
    expect(settings.getLibraryName()).toBe('Static Library');
    expect(settings.isRegistrationOpen()).toBe(false);
    expect(settings.getLogoPath()).toBe(`${BASE}/media/logo.svg`);
    expect(settings.getLogoDarkPath()).toBe(`${BASE}/media/logo-dark.svg`);
    expect(settings.hasDedicatedDarkLogo()).toBe(true);
    expect(settings.shouldInvertLogoInDarkMode()).toBe(true);

    mockContent({});
    clearContentCache();
    const defaults = await new StaticSettingsRepository().get();
    expect(defaults.getLibraryName()).toBe('Open Knowledge');
    expect(defaults.getLogoDarkPath()).toBeNull();
    expect(defaults.shouldInvertLogoInDarkMode()).toBe(false);
  });

  it('maps the raw content URL to a browsable source URL', () => {
    process.env.OK_CONTENT_REPO = 'https://raw.githubusercontent.com/oegea/open-library/main';
    expect(getContentSourceUrl()).toBe('https://github.com/oegea/open-library/tree/main');

    process.env.OK_CONTENT_REPO =
      'https://raw.githubusercontent.com/oegea/open-library/refs/heads/main';
    expect(getContentSourceUrl()).toBe('https://github.com/oegea/open-library/tree/main');

    // Non-GitHub origins pass through untouched.
    process.env.OK_CONTENT_REPO = 'https://content.example.org/library';
    expect(getContentSourceUrl()).toBe('https://content.example.org/library');
  });

  it('caches documents between calls', async () => {
    mockContent({ 'news/index.json': [] });
    const repository = new StaticNewsRepository();
    await repository.findAll(true);
    await repository.findAll(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
