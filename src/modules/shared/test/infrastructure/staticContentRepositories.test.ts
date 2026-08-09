import { clearContentCache } from '../../infrastructure/StaticContentClient';
import { StaticCourseRepository } from '../../../course/infrastructure/StaticCourseRepository';
import { StaticNewsRepository } from '../../../news/infrastructure/StaticNewsRepository';
import { StaticPageRepository } from '../../../pages/infrastructure/StaticPageRepository';
import { StaticSettingsRepository } from '../../../settings/infrastructure/StaticSettingsRepository';
import * as CourseMother from '../../../course/test/helpers/CourseMother';
import * as NewsPostMother from '../../../news/test/helpers/NewsPostMother';

const BASE = 'https://raw.example/content/main';

function mockContent(documents: Record<string, unknown>) {
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const relative = url.replace(`${BASE}/`, '');
    if (relative in documents) {
      return new Response(JSON.stringify(documents[relative]), {
        status: 200,
        headers: { etag: `"${relative}"` },
      });
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

  it('loads courses from the index, resolving relative media', async () => {
    const primitive = {
      ...CourseMother.createPrimitive(),
      coverImage: 'media/cover.svg',
      published: true,
    };
    mockContent({
      'courses/index.json': ['astronomy'],
      'courses/astronomy.json': primitive,
    });

    const repository = new StaticCourseRepository();
    const list = await repository.findAll({ publishedOnly: true });

    expect(list.count()).toBe(1);
    const course = list.getCourses()[0];
    expect(course.getCoverImage()).toBe(`${BASE}/media/cover.svg`);
    expect(await repository.findBySlug(course.getSlug())).not.toBeNull();
    expect(await repository.findById(primitive.id!)).not.toBeNull();
  });

  it('filters courses in memory and refuses writes', async () => {
    const es = { ...CourseMother.createPrimitive(), id: 'c1', slug: 'c1', language: 'es', published: true };
    const en = { ...CourseMother.createPrimitive(), id: 'c2', slug: 'c2', language: 'en', published: true };
    mockContent({
      'courses/index.json': ['c1', 'c2'],
      'courses/c1.json': es,
      'courses/c2.json': en,
    });

    const repository = new StaticCourseRepository();
    expect((await repository.findAll({ language: 'es' })).count()).toBe(1);
    await expect(repository.save()).rejects.toThrow('read-only');
    await expect(repository.delete()).rejects.toThrow('read-only');
  });

  it('serves news and pages, hiding drafts from the published feed', async () => {
    mockContent({
      'news/index.json': [
        NewsPostMother.create({ id: 'n1', slug: 'n1', published: true }).toPrimitive(),
        NewsPostMother.create({ id: 'n2', slug: 'n2', published: false }).toPrimitive(),
      ],
      'pages/index.json': [
        {
          id: 'p1',
          title: 'About',
          slug: 'about',
          markdown: 'Hello',
          placement: 'footer',
          position: 0,
          createdAt: '2026-08-09T00:00:00.000Z',
          updatedAt: '2026-08-09T00:00:00.000Z',
        },
      ],
    });

    expect((await new StaticNewsRepository().findAll(true)).length).toBe(1);
    expect((await new StaticPageRepository().findByPlacement('footer')).length).toBe(1);
    expect(await new StaticPageRepository().findBySlug('about')).not.toBeNull();
  });

  it('forces registration closed and falls back to defaults without settings.json', async () => {
    mockContent({
      'settings.json': {
        libraryName: 'Static Library',
        registrationOpen: true,
        newsEnabled: true,
        logoPath: 'media/logo.svg',
      },
    });

    const settings = await new StaticSettingsRepository().get();
    expect(settings.getLibraryName()).toBe('Static Library');
    expect(settings.isRegistrationOpen()).toBe(false);
    expect(settings.getLogoPath()).toBe(`${BASE}/media/logo.svg`);

    mockContent({});
    clearContentCache();
    const defaults = await new StaticSettingsRepository().get();
    expect(defaults.getLibraryName()).toBe('Open Knowledge');
  });

  it('caches documents between calls', async () => {
    mockContent({ 'news/index.json': [] });
    const repository = new StaticNewsRepository();
    await repository.findAll(true);
    await repository.findAll(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
