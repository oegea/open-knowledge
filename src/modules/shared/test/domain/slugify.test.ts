import { ensureUniqueSlug, slugify } from '../../domain/slugify';

describe('slugify (unit)', () => {
  it('sanitizes titles into URL slugs', () => {
    expect(slugify('Introducción a la Astronomía')).toBe('introduccion-a-la-astronomia');
    expect(slugify('  ¿Qué es Open Knowledge?  ')).toBe('que-es-open-knowledge');
    expect(slugify('C++ & Rust: 101')).toBe('c-rust-101');
  });

  it('falls back when nothing sanitizable remains', () => {
    expect(slugify('???')).toBe('untitled');
    expect(slugify('星空课程', 'course')).toBe('course');
  });

  it('caps the length without leaving a trailing hyphen', () => {
    const slug = slugify(`${'palabra '.repeat(20)}final`);
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith('-')).toBe(false);
  });

  it('ensureUniqueSlug appends a numeric suffix until free', async () => {
    const taken = new Set(['astronomia', 'astronomia-2']);
    const slug = await ensureUniqueSlug('astronomia', async (candidate) => taken.has(candidate));
    expect(slug).toBe('astronomia-3');
  });
});
