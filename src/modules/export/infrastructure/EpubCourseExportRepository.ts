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

const EPUB_CSS = `
body { font-family: Georgia, serif; line-height: 1.6; margin: 5%; }
h1, h2, h3 { font-family: Helvetica, Arial, sans-serif; line-height: 1.25; }
a { color: #0e7c86; }
blockquote { border-left: 3px solid #0e7c86; margin-left: 0; padding-left: 1em; font-style: italic; }
code { font-family: monospace; background: #eef2f5; padding: 0.1em 0.3em; border-radius: 3px; }
pre { background: #131a21; color: #eef2f5; padding: 1em; border-radius: 6px; overflow-x: auto; }
pre code { background: none; color: inherit; }
.meta { color: #66757f; font-size: 0.9em; }
.cover { text-align: center; }
.cover img.cover-image { max-width: 100%; border-radius: 8px; }
.cover h1 { font-size: 1.9em; margin: 1.2em 0 0.4em; }
.cover .authors { color: #66757f; font-size: 1.05em; margin-top: 0; }
.cover .brand { margin-top: 4em; border-top: 1px solid #dfe6eb; padding-top: 1.5em; }
.cover .brand img.logo { max-height: 3em; }
.cover .brand .library { font-family: Helvetica, Arial, sans-serif; font-weight: bold; margin: 0.4em 0 0.1em; }
.cover .brand .url { color: #66757f; font-size: 0.85em; margin: 0; }
.credits { font-size: 0.95em; }
.notice { border: 1px solid #dfe6eb; border-radius: 8px; padding: 1em; margin: 1.5em 0; }
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

function xhtml(title: string, body: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${escapeXml(title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>${body}</body>
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
    const coverHref = await addImage(context.coverMediaPath, 'cover-image', true);
    const logoHref = await addImage(context.logoMediaPath, 'logo-image', false);

    const dateText = context.generatedAt.toISOString().slice(0, 10);

    // Cover page, book style: image, title, authors and publisher brand.
    let libraryUrl: string;
    try {
      libraryUrl = new URL(context.courseUrl).origin;
    } catch {
      libraryUrl = context.courseUrl;
    }
    const coverBody = `<section epub:type="cover titlepage" class="cover">
${coverHref ? `<p><img class="cover-image" src="${coverHref}" alt=""/></p>` : ''}
<h1>${escapeXml(course.getTitle())}</h1>
${course.getAuthors().length > 0 ? `<p class="authors">${escapeXml(course.getAuthors().join(', '))}</p>` : ''}
<div class="brand">
${logoHref ? `<img class="logo" src="${logoHref}" alt="${escapeXml(context.libraryName)}"/>` : ''}
<p class="library">${escapeXml(context.libraryName)}</p>
<p class="url">${escapeXml(libraryUrl)}</p>
</div>
</section>`;
    zip.addFile('OEBPS/cover.xhtml', Buffer.from(xhtml(course.getTitle(), coverBody)));

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

    // One chapter per material, in pedagogical order.
    const materials = course
      .getSections()
      .getSections()
      .flatMap((section) => section.getMaterials().getMaterials());

    const chapters: { id: string; href: string; title: string }[] = [];
    for (const [index, material] of materials.entries()) {
      const id = `chapter-${index + 1}`;
      const href = `${id}.xhtml`;
      const body = `<h1>${escapeXml(material.getTitle())}</h1>\n${await this.materialBody(material, context)}`;
      zip.addFile(`OEBPS/${href}`, Buffer.from(xhtml(material.getTitle(), body)));
      chapters.push({ id, href, title: material.getTitle() });
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
    const navItems = chapters
      .map((chapter) => `<li><a href="${chapter.href}">${escapeXml(chapter.title)}</a></li>`)
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
<head><title>${escapeXml(strings.toc)}</title></head>
<body><nav epub:type="toc"><h1>${escapeXml(strings.toc)}</h1>
<ol><li><a href="cover.xhtml">${escapeXml(course.getTitle())}</a></li>
<li><a href="credits.xhtml">${escapeXml(strings.credits)}</a></li>${navItems}</ol>
</nav></body></html>`)
    );

    // Package document.
    const manifestEntries = [
      `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
      `<item id="style" href="style.css" media-type="text/css"/>`,
      `<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>`,
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
      `<itemref idref="cover"/>`,
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
