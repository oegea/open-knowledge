import AdmZip from 'adm-zip';
import { marked } from 'marked';
import path from 'path';
import { Course } from '../../course/domain/Course';
import { Material } from '../../course/domain/Material';
import {
  CourseExportRepository,
  ExportContext,
  ExportedDocument,
} from '../domain/CourseExportRepository';
import { collectBibliography } from '../domain/bibliography';
import { MediaRepository } from '../../media/domain/MediaRepository';
import { FilesystemMediaRepository } from '../../media/infrastructure/FilesystemMediaRepository';
import { renderEpubCover } from './EpubCoverImage';

/*
 * Reading apps repaint text for night and sepia themes but usually keep
 * author backgrounds: nothing here sets a light background behind text, so
 * every block stays legible whatever theme the reader picks.
 */
const EPUB_CSS = `
body { font-family: Georgia, "Iowan Old Style", serif; line-height: 1.65; margin: 5%; }
p { margin: 0 0 0.9em; orphans: 2; widows: 2; }
h1, h2, h3, h4 { font-family: Helvetica, Arial, sans-serif; line-height: 1.22; page-break-after: avoid; break-after: avoid; }
h1 { font-size: 1.7em; margin: 0 0 1em; padding-bottom: 0.45em; border-bottom: 2px solid #189ea6; }
h2 { font-size: 1.3em; margin: 1.8em 0 0.6em; }
h3 { font-size: 1.1em; margin: 1.5em 0 0.5em; }
a { color: #0e7c86; }
ul, ol { margin: 0 0 0.9em; padding-left: 1.4em; }
li { margin-bottom: 0.3em; }
img { max-width: 100%; height: auto; }
hr { border: none; border-top: 1px solid #94a2af; width: 30%; margin: 2em auto; }
blockquote { border-left: 3px solid #189ea6; margin: 1.2em 0; padding: 0.1em 0 0.1em 1em; font-style: italic; }
code { font-family: monospace; font-size: 0.9em; }
pre { background: #131a21; color: #eef2f5; padding: 1em; border-radius: 6px; overflow-x: auto; white-space: pre-wrap; font-size: 0.85em; line-height: 1.5; }
pre code { color: inherit; font-size: inherit; }
table { border-collapse: collapse; margin: 1.2em 0; font-family: Helvetica, Arial, sans-serif; font-size: 0.9em; }
th, td { border-bottom: 1px solid #94a2af; padding: 0.4em 0.9em 0.4em 0; text-align: left; vertical-align: top; }
th { border-bottom-width: 2px; }
.meta { color: #66757f; font-size: 0.9em; }
.kicker { font-family: Helvetica, Arial, sans-serif; font-size: 0.75em; font-weight: bold; letter-spacing: 0.12em; text-transform: uppercase; color: #0e7c86; margin: 0 0 0.6em; }
body.cover-page { margin: 0; padding: 0; text-align: center; }
.cover { margin: 0; padding: 0; }
.cover img.cover-image { max-width: 100%; max-height: 100vh; }
.titlepage { text-align: center; padding-top: 18%; }
.titlepage h1 { font-size: 2.1em; border: none; margin: 0 0 0.5em; padding: 0; }
.titlepage .rule { width: 3.5em; border: none; border-top: 3px solid #189ea6; margin: 1.4em auto; }
.titlepage .authors { color: #66757f; font-size: 1.1em; margin: 0; }
.titlepage .brand { margin-top: 5em; }
.titlepage .brand img.logo { max-height: 3em; }
.titlepage .brand .library { font-family: Helvetica, Arial, sans-serif; font-weight: bold; margin: 0.4em 0 0.1em; }
.titlepage .brand .url { color: #66757f; font-size: 0.85em; margin: 0; }
.credits { font-size: 0.95em; }
.notice { border: 1px solid #94a2af; border-radius: 8px; padding: 1em; margin: 1.5em 0; }
.notice p:last-child { margin-bottom: 0; }
nav ol { list-style: none; padding-left: 0; }
nav ol ol { padding-left: 1.2em; margin: 0.3em 0 0.8em; }
nav .part { font-family: Helvetica, Arial, sans-serif; font-weight: bold; }
`;

/**
 * marked emits HTML5, where void elements are left unclosed; EPUB documents
 * are XML and reject them, so those tags become self-closing.
 */
function toXhtml(html: string): string {
  return html.replace(/<(img|br|hr|input)((?:[^>"']|"[^"]*"|'[^']*')*?)\s*\/?>/g, '<$1$2/>');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function xhtml(title: string, body: string, bodyClass?: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${escapeXml(title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>${body}</body>
</html>`;
}

const MIME_BY_EXTENSION: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
};

export class EpubCourseExportRepository implements CourseExportRepository {
  constructor(private readonly mediaRepository: MediaRepository = new FilesystemMediaRepository()) {}

  async export(course: Course, context: ExportContext): Promise<ExportedDocument> {
    // noSort: adm-zip alphabetizes entries on write by default, which would
    // demote the mimetype entry from the first slot the OCF spec requires.
    const zip = new AdmZip(undefined, { noSort: true });
    const { strings } = context;

    // The mimetype entry must exist, come first and be uncompressed.
    zip.addFile('mimetype', Buffer.from('application/epub+zip'));
    const mimetypeEntry = zip.getEntry('mimetype');
    if (mimetypeEntry) mimetypeEntry.header.method = 0;

    zip.addFile(
      'META-INF/container.xml',
      Buffer.from(`<?xml version="1.0" encoding="utf-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`)
    );

    zip.addFile('OEBPS/style.css', Buffer.from(EPUB_CSS));

    // Optional images (cover + logo).
    const manifestImages: { id: string; href: string; mime: string; isCover: boolean }[] = [];
    const addImage = async (mediaPath: string | null, id: string, isCover: boolean) => {
      if (!mediaPath) return null;
      const stored = await this.mediaRepository.retrieve(mediaPath);
      if (!stored) return null;
      const extension = path.extname(mediaPath).toLowerCase();
      const mime = MIME_BY_EXTENSION[extension];
      if (!mime) return null;
      const href = `images/${id}${extension}`;
      zip.addFile(`OEBPS/${href}`, stored.data);
      manifestImages.push({ id, href, mime, isCover });
      return href;
    };
    // The cover is composed as a portrait JPEG (see EpubCoverImage). If the
    // renderer fails for any reason the raw course image stands in, as before.
    let coverHref: string | null = null;
    try {
      const courseImage = context.coverMediaPath
        ? await this.mediaRepository.retrieve(context.coverMediaPath)
        : null;
      const cover = await renderEpubCover({
        title: course.getTitle(),
        authors: course.getAuthors(),
        libraryName: context.libraryName,
        image: courseImage?.data ?? null,
      });
      coverHref = 'images/cover.jpg';
      zip.addFile(`OEBPS/${coverHref}`, cover);
      manifestImages.push({ id: 'cover-image', href: coverHref, mime: 'image/jpeg', isCover: true });
    } catch {
      coverHref = await addImage(context.coverMediaPath, 'cover-image', true);
    }
    const logoHref = await addImage(context.logoMediaPath, 'logo-image', false);

    const dateText = context.generatedAt.toISOString().slice(0, 10);

    let libraryUrl: string;
    try {
      libraryUrl = new URL(context.courseUrl).origin;
    } catch {
      libraryUrl = context.courseUrl;
    }

    // Cover: the composed image alone, as a printed book's jacket. Without
    // an image there is nothing to show and the title page opens the book.
    if (coverHref) {
      const coverBody = `<section epub:type="cover" class="cover">
<img class="cover-image" src="${coverHref}" alt="${escapeXml(course.getTitle())}"/>
</section>`;
      zip.addFile(
        'OEBPS/cover.xhtml',
        Buffer.from(xhtml(course.getTitle(), coverBody, 'cover-page'))
      );
    }

    // Title page: title, authors and publisher brand, set by the reader's
    // own fonts (so it also covers scripts the cover image cannot letter).
    const titleBody = `<section epub:type="titlepage" class="titlepage">
<h1>${escapeXml(course.getTitle())}</h1>
<hr class="rule"/>
${course.getAuthors().length > 0 ? `<p class="authors">${escapeXml(course.getAuthors().join(', '))}</p>` : ''}
<div class="brand">
${logoHref ? `<img class="logo" src="${logoHref}" alt="${escapeXml(context.libraryName)}"/>` : ''}
<p class="library">${escapeXml(context.libraryName)}</p>
<p class="url">${escapeXml(libraryUrl)}</p>
</div>
</section>`;
    zip.addFile('OEBPS/titlepage.xhtml', Buffer.from(xhtml(course.getTitle(), titleBody)));

    // Credits page: description, provenance, AI and Open Knowledge notices.
    const creditsBody = `<section epub:type="copyright-page" class="credits">
<p>${escapeXml(course.getDescription())}</p>
${course.getAuthors().length > 0 ? `<p class="meta">${escapeXml(strings.authors)}: ${escapeXml(course.getAuthors().join(', '))}</p>` : ''}
${course.getLicense() ? `<p class="meta">${escapeXml(strings.license)}: ${escapeXml(course.getLicense()!)}</p>` : ''}
${course.isAiAssisted() ? `<div class="notice">
<p><strong>${escapeXml(strings.aiNoticeTitle)}</strong></p>
<p class="meta">${escapeXml(strings.aiNotice)}</p>
</div>` : ''}
<div class="notice">
<p class="meta">${escapeXml(
      strings.generatedNote
        .replace('{date}', dateText)
        .replace('{url}', context.courseUrl)
    )}</p>
<p class="meta">${escapeXml(strings.generatedWith)} ${escapeXml(strings.aboutOpenKnowledge)}</p>
<p class="meta">${escapeXml(strings.responsible.replace('{owner}', context.ownerName))}</p>
</div>
</section>`;
    zip.addFile('OEBPS/credits.xhtml', Buffer.from(xhtml(strings.credits, creditsBody)));

    // One chapter per material, in pedagogical order. Each opens with its
    // section as a kicker, and the table of contents groups them by section.
    const chapters: { id: string; href: string; title: string }[] = [];
    const parts: { title: string; chapters: { href: string; title: string }[] }[] = [];
    const sections = course.getSections().getSections();
    for (const [sectionIndex, section] of sections.entries()) {
      const part = { title: section.getTitle(), chapters: [] as { href: string; title: string }[] };
      for (const material of section.getMaterials().getMaterials()) {
        const id = `chapter-${chapters.length + 1}`;
        const href = `${id}.xhtml`;
        const kicker = `<p class="kicker">${sectionIndex + 1} · ${escapeXml(section.getTitle())}</p>`;
        const body = `${kicker}\n<h1>${escapeXml(material.getTitle())}</h1>\n${await this.materialBody(material, context)}`;
        zip.addFile(`OEBPS/${href}`, Buffer.from(xhtml(material.getTitle(), body)));
        chapters.push({ id, href, title: material.getTitle() });
        part.chapters.push({ href, title: material.getTitle() });
      }
      if (part.chapters.length > 0) parts.push(part);
    }

    // Bibliography & sources, aggregated from the course and its materials.
    const bibliography = collectBibliography(course);
    if (bibliography.length > 0) {
      const items = bibliography
        .map((source) => {
          const title = escapeXml(source.title);
          return `<li>${source.url ? `<a href="${escapeXml(source.url)}">${title}</a>` : title}</li>`;
        })
        .join('\n');
      const body = `<h1>${escapeXml(strings.bibliography)}</h1>\n<ul>\n${items}\n</ul>`;
      zip.addFile('OEBPS/bibliography.xhtml', Buffer.from(xhtml(strings.bibliography, body)));
    }

    // Navigation document.
    const navItems = parts
      .map(
        (part) =>
          `<li><span class="part">${escapeXml(part.title)}</span>\n<ol>${part.chapters
            .map((chapter) => `<li><a href="${chapter.href}">${escapeXml(chapter.title)}</a></li>`)
            .join('\n')}</ol></li>`
      )
      .concat(
        bibliography.length > 0
          ? [`<li><a href="bibliography.xhtml">${escapeXml(strings.bibliography)}</a></li>`]
          : []
      )
      .join('\n');
    zip.addFile(
      'OEBPS/nav.xhtml',
      Buffer.from(`<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${escapeXml(strings.toc)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body><nav epub:type="toc"><h1>${escapeXml(strings.toc)}</h1>
<ol><li><a href="titlepage.xhtml">${escapeXml(course.getTitle())}</a></li>
<li><a href="credits.xhtml">${escapeXml(strings.credits)}</a></li>${navItems}</ol>
</nav></body></html>`)
    );

    // Package document.
    const manifestEntries = [
      `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
      `<item id="style" href="style.css" media-type="text/css"/>`,
      ...(coverHref
        ? [`<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>`]
        : []),
      `<item id="titlepage" href="titlepage.xhtml" media-type="application/xhtml+xml"/>`,
      `<item id="credits" href="credits.xhtml" media-type="application/xhtml+xml"/>`,
      ...chapters.map(
        (chapter) =>
          `<item id="${chapter.id}" href="${chapter.href}" media-type="application/xhtml+xml"/>`
      ),
      ...(bibliography.length > 0
        ? [`<item id="bibliography" href="bibliography.xhtml" media-type="application/xhtml+xml"/>`]
        : []),
      ...manifestImages.map(
        (image) =>
          `<item id="${image.id}" href="${image.href}" media-type="${image.mime}"${image.isCover ? ' properties="cover-image"' : ''}/>`
      ),
    ].join('\n    ');
    const spineEntries = [
      ...(coverHref ? [`<itemref idref="cover"/>`] : []),
      `<itemref idref="titlepage"/>`,
      `<itemref idref="credits"/>`,
      ...chapters.map((chapter) => `<itemref idref="${chapter.id}"/>`),
      ...(bibliography.length > 0 ? [`<itemref idref="bibliography"/>`] : []),
    ].join('\n    ');

    zip.addFile(
      'OEBPS/content.opf',
      Buffer.from(`<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="pub-id">${escapeXml(context.courseUrl)}</dc:identifier>
    <dc:title>${escapeXml(course.getTitle())}</dc:title>
    <dc:language>${escapeXml(course.getLanguage())}</dc:language>
    ${course.getAuthors().map((author) => `<dc:creator>${escapeXml(author)}</dc:creator>`).join('\n    ')}
    <dc:publisher>${escapeXml(context.libraryName)}</dc:publisher>
    ${course.getLicense() ? `<dc:rights>${escapeXml(course.getLicense()!)}</dc:rights>` : ''}
    <meta property="dcterms:modified">${context.generatedAt.toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
    ${coverHref ? '<meta name="cover" content="cover-image"/>' : ''}
  </metadata>
  <manifest>
    ${manifestEntries}
  </manifest>
  <spine>
    ${spineEntries}
  </spine>
</package>`)
    );

    return { data: zip.toBuffer(), mime: 'application/epub+zip', extension: 'epub' };
  }

  private async materialBody(material: Material, context: ExportContext): Promise<string> {
    if (material.getType() === 'markdown') {
      return toXhtml(String(await marked.parse(material.getMarkdown())));
    }

    // Audio, video and exams live online: point the reader to the material URL.
    const url = context.materialUrl(material.getId());
    const notes = material.getMarkdown()
      ? toXhtml(String(await marked.parse(material.getMarkdown())))
      : '';
    return `<div class="notice">
<p>${escapeXml(context.strings.consultOnline)}</p>
<p><a href="${escapeXml(url)}">${escapeXml(url)}</a></p>
</div>
${notes}`;
  }
}
