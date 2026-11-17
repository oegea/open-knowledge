import AdmZip from 'adm-zip';
import sharp from 'sharp';
import { EpubCourseExportRepository } from '../../infrastructure/EpubCourseExportRepository';
import * as CourseMother from '../../../course/test/helpers/CourseMother';
import * as SectionMother from '../../../course/test/helpers/SectionMother';
import * as MaterialMother from '../../../course/test/helpers/MaterialMother';
import * as ExportContextMother from '../helpers/ExportContextMother';
import * as MediaRepositoryMother from '../helpers/MediaRepositoryMother';

function entryText(zip: AdmZip, name: string): string {
  const entry = zip.getEntry(name);
  if (!entry) throw new Error(`Missing EPUB entry: ${name}`);
  return entry.getData().toString('utf-8');
}

describe('EpubCourseExportRepository (integration)', () => {
  async function exportZip(overrides: Parameters<typeof CourseMother.create>[0] = {}) {
    const repository = new EpubCourseExportRepository(MediaRepositoryMother.withImages());
    const context = ExportContextMother.create({
      coverMediaPath: 'covers/astronomy.png',
      logoMediaPath: 'images/logo.png',
    });
    const course = CourseMother.create({ published: true, aiAssisted: true, ...overrides });
    const result = await repository.export(course, context);
    return new AdmZip(result.data);
  }

  it('keeps the mimetype entry first and uncompressed', async () => {
    const zip = await exportZip();
    const entries = zip.getEntries();
    expect(entries[0].entryName).toBe('mimetype');
    expect(entries[0].header.method).toBe(0);
    expect(entries[0].getData().toString()).toBe('application/epub+zip');
  });

  it('opens with a composed portrait JPEG cover, alone on its page', async () => {
    const zip = await exportZip();
    const cover = entryText(zip, 'OEBPS/cover.xhtml');

    expect(cover).toContain('epub:type="cover"');
    expect(cover).toContain('src="images/cover.jpg"');
    expect(cover).toContain('alt="Introduction to Astronomy"');

    const image = zip.getEntry('OEBPS/images/cover.jpg')!.getData();
    // JPEG magic number, and book proportions (2:3 portrait).
    expect(image.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
    const { width, height } = await sharp(image).metadata();
    expect(width).toBe(1600);
    expect(height).toBe(2400);
  });

  it('follows with a title page: title, authors and brand only', async () => {
    const zip = await exportZip();
    const titlePage = entryText(zip, 'OEBPS/titlepage.xhtml');

    expect(titlePage).toContain('epub:type="titlepage"');
    expect(titlePage).toContain('Introduction to Astronomy');
    expect(titlePage).toContain('Carl S.');
    expect(titlePage).toContain('My Library');
    expect(titlePage).toContain('https://library.example');
    expect(titlePage).toContain('images/logo-image.png');
    // Notices moved to the credits page.
    expect(titlePage).not.toContain('AI-assisted');
    expect(titlePage).not.toContain('License');
    expect(titlePage).not.toContain('Responsible');
  });

  it('still composes a cover when the course has no image', async () => {
    const repository = new EpubCourseExportRepository(MediaRepositoryMother.create());
    const result = await repository.export(
      CourseMother.create({ published: true }),
      ExportContextMother.create({ coverMediaPath: null, logoMediaPath: null })
    );
    const zip = new AdmZip(result.data);

    expect(zip.getEntry('OEBPS/images/cover.jpg')).not.toBeNull();
    expect(entryText(zip, 'OEBPS/titlepage.xhtml')).not.toContain('<img');
  });

  it('moves description, license and notices to the credits page', async () => {
    const zip = await exportZip();
    const credits = entryText(zip, 'OEBPS/credits.xhtml');

    expect(credits).toContain('epub:type="copyright-page"');
    expect(credits).toContain('A journey through the night sky');
    expect(credits).toContain('License: CC BY-SA 4.0');
    expect(credits).toContain('AI-assisted content');
    expect(credits).toContain('Responsible: Ada.');
    expect(credits).toContain('Generated with Open Knowledge.');
  });

  it('orders the spine as cover, title page, credits, chapters and lists them in the nav', async () => {
    const zip = await exportZip();
    const opf = entryText(zip, 'OEBPS/content.opf');
    const nav = entryText(zip, 'OEBPS/nav.xhtml');

    const spine = opf.slice(opf.indexOf('<spine>'));
    expect(spine.indexOf('idref="cover"')).toBeGreaterThan(-1);
    expect(spine.indexOf('idref="cover"')).toBeLessThan(spine.indexOf('idref="titlepage"'));
    expect(spine.indexOf('idref="titlepage"')).toBeLessThan(spine.indexOf('idref="credits"'));
    expect(spine.indexOf('idref="credits"')).toBeLessThan(spine.indexOf('idref="chapter-1"'));

    expect(opf).toContain('properties="cover-image"');
    expect(opf).toContain('<meta name="cover" content="cover-image"/>');

    expect(nav).toContain('href="titlepage.xhtml"');
    expect(nav).toContain('>Credits<');
  });

  it('groups chapters by section in the nav and opens each with its section', async () => {
    const zip = await exportZip({
      sections: [
        SectionMother.createPrimitive({
          title: 'First steps',
          materials: [MaterialMother.createPrimitive({ title: 'The Solar System' })],
        }),
      ],
    });
    const nav = entryText(zip, 'OEBPS/nav.xhtml');
    const chapter = entryText(zip, 'OEBPS/chapter-1.xhtml');

    expect(nav).toMatch(
      /<span class="part">First steps<\/span>\s*<ol><li><a href="chapter-1.xhtml">The Solar System<\/a>/
    );
    expect(chapter).toContain('<p class="kicker">1 · First steps</p>');
    expect(chapter).toContain('<h1>The Solar System</h1>');
  });

  it('self-closes void elements so chapters stay valid XML', async () => {
    const zip = await exportZip({
      sections: [
        SectionMother.createPrimitive({
          materials: [
            MaterialMother.createPrimitive({
              markdown: '- [x] hecho\n- [ ] pendiente\n\n---\n\nSalto  \nde línea',
            }),
          ],
        }),
      ],
    });
    const chapter = entryText(zip, 'OEBPS/chapter-1.xhtml');
    expect(chapter).toContain('type="checkbox"/>');
    expect(chapter).toContain('<hr/>');
    // No void element may remain unclosed anywhere in the chapter.
    expect(chapter).not.toMatch(/<(?:input|hr|br|img)(?![^>]*\/>)[^>]*>/);
  });

  it('omits the AI notice for non AI-assisted courses', async () => {
    const zip = await exportZip({ aiAssisted: false });
    expect(entryText(zip, 'OEBPS/credits.xhtml')).not.toContain('AI-assisted');
  });
});
