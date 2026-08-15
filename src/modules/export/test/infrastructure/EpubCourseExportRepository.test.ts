import AdmZip from 'adm-zip';
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

  it('renders a book-style cover: image, title, authors and brand only', async () => {
    const zip = await exportZip();
    const cover = entryText(zip, 'OEBPS/cover.xhtml');

    expect(cover).toContain('epub:type="cover titlepage"');
    expect(cover).toContain('Introduction to Astronomy');
    expect(cover).toContain('Carl S.');
    expect(cover).toContain('My Library');
    expect(cover).toContain('https://library.example');
    expect(cover).toContain('images/cover-image.png');
    // Notices moved to the credits page.
    expect(cover).not.toContain('AI-assisted');
    expect(cover).not.toContain('License');
    expect(cover).not.toContain('Responsible');
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

  it('orders the spine as cover, credits, chapters and lists both in the nav', async () => {
    const zip = await exportZip();
    const opf = entryText(zip, 'OEBPS/content.opf');
    const nav = entryText(zip, 'OEBPS/nav.xhtml');

    const spine = opf.slice(opf.indexOf('<spine>'));
    expect(spine.indexOf('idref="cover"')).toBeGreaterThan(-1);
    expect(spine.indexOf('idref="cover"')).toBeLessThan(spine.indexOf('idref="credits"'));
    expect(spine.indexOf('idref="credits"')).toBeLessThan(spine.indexOf('idref="chapter-1"'));

    expect(opf).toContain('properties="cover-image"');
    expect(opf).toContain('<meta name="cover" content="cover-image"/>');

    expect(nav).toContain('href="cover.xhtml"');
    expect(nav).toContain('>Credits<');
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
