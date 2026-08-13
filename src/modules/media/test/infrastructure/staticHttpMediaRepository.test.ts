import { StaticHttpMediaRepository } from '../../infrastructure/StaticHttpMediaRepository';

const BASE = 'https://raw.example/content/main';

describe('StaticHttpMediaRepository (unit)', () => {
  beforeEach(() => {
    process.env.OK_CONTENT_REPO = BASE;
    jest.clearAllMocks();
  });

  afterAll(() => {
    delete process.env.OK_CONTENT_REPO;
  });

  it('fetches repo-relative paths against the content repository', async () => {
    global.fetch = jest.fn(
      async () =>
        new Response(Buffer.from([1, 2, 3]), {
          status: 200,
          headers: { 'content-type': 'image/png' },
        })
    ) as unknown as typeof fetch;

    const stored = await new StaticHttpMediaRepository().retrieve('media/logo.png');

    expect(global.fetch).toHaveBeenCalledWith(`${BASE}/media/logo.png`, { cache: 'no-store' });
    expect(stored).not.toBeNull();
    expect(stored!.mime).toBe('image/png');
    expect(stored!.size).toBe(3);
  });

  it('passes absolute URLs through untouched', async () => {
    global.fetch = jest.fn(
      async () => new Response(Buffer.from([1]), { status: 200 })
    ) as unknown as typeof fetch;

    await new StaticHttpMediaRepository().retrieve('https://elsewhere.example/logo.png');

    expect(global.fetch).toHaveBeenCalledWith('https://elsewhere.example/logo.png', {
      cache: 'no-store',
    });
  });

  it('returns null on missing files and network errors', async () => {
    global.fetch = jest.fn(async () => new Response('nope', { status: 404 })) as unknown as
      typeof fetch;
    expect(await new StaticHttpMediaRepository().retrieve('media/missing.png')).toBeNull();

    global.fetch = jest.fn(async () => {
      throw new Error('network down');
    }) as unknown as typeof fetch;
    expect(await new StaticHttpMediaRepository().retrieve('media/logo.png')).toBeNull();
  });

  it('is read-only', async () => {
    const repository = new StaticHttpMediaRepository();
    await expect(repository.store()).rejects.toThrow('read-only');
    await expect(repository.remove()).rejects.toThrow('read-only');
  });
});
