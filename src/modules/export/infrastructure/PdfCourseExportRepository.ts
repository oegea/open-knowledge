import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import { marked, type Token, type Tokens } from 'marked';
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

const TEAL = '#0e7c86';
const INK = '#131a21';
const MUTED = '#66757f';

/** Flattens inline tokens to plain text, appending link targets. */
function inlineText(tokens: Token[] | undefined, fallback = ''): string {
  if (!tokens) return fallback;
  return tokens
    .map((token) => {
      switch (token.type) {
        case 'link': {
          const link = token as Tokens.Link;
          const text = inlineText(link.tokens, link.text);
          return text === link.href ? text : `${text} (${link.href})`;
        }
        case 'image':
          return (token as Tokens.Image).text ?? '';
        case 'strong':
        case 'em':
        case 'del':
          return inlineText((token as Tokens.Strong).tokens, (token as Tokens.Strong).text);
        case 'codespan':
          return (token as Tokens.Codespan).text;
        case 'br':
          return '\n';
        default:
          return 'text' in token ? String((token as Tokens.Text).text) : '';
      }
    })
    .join('');
}

export class PdfCourseExportRepository implements CourseExportRepository {
  constructor(private readonly mediaRepository: MediaRepository = new FilesystemMediaRepository()) {}

  async export(course: Course, context: ExportContext): Promise<ExportedDocument> {
    const { strings } = context;
    const doc = new PDFDocument({
      size: 'A4',
      // Pages stay in memory until the end so the TOC and footers can be
      // backfilled with real page numbers once the layout is known.
      bufferPages: true,
      margins: { top: 64, bottom: 64, left: 64, right: 64 },
      info: {
        Title: course.getTitle(),
        Author: course.getAuthors().join(', ') || context.libraryName,
        Creator: 'Open Knowledge',
      },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    const finished = new Promise<Buffer>((resolve) =>
      doc.on('end', () => resolve(Buffer.concat(chunks)))
    );

    // ---------------------------------------------------------------- //
    // Front page                                                        //
    // ---------------------------------------------------------------- //
    const logo = await this.loadRasterImage(context.logoMediaPath);
    if (logo) {
      doc.image(logo, doc.page.width / 2 - 48, doc.y, { fit: [96, 48], align: 'center' });
      // Explicit-coordinate images do not advance the cursor.
      doc.y += 64;
    } else {
      doc.font('Helvetica-Bold').fontSize(12).fillColor(TEAL);
      doc.text(context.libraryName.toUpperCase(), { align: 'center', characterSpacing: 1.5 });
      doc.moveDown(1.5);
    }

    const cover = await this.loadRasterImage(context.coverMediaPath);
    if (cover) {
      const width = doc.page.width - 128;
      doc.image(cover, 64, doc.y, { fit: [width, 220], align: 'center' });
      doc.moveDown(1);
      doc.y += 228;
    }

    doc.font('Helvetica-Bold').fontSize(26).fillColor(INK);
    doc.text(course.getTitle(), { align: 'center' });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(12).fillColor(MUTED);
    doc.text(course.getDescription(), { align: 'center' });
    doc.moveDown(1);

    if (course.getAuthors().length > 0) {
      doc.fontSize(10).text(`${strings.authors}: ${course.getAuthors().join(', ')}`, {
        align: 'center',
      });
    }
    if (course.getLicense()) {
      doc.fontSize(10).text(`${strings.license}: ${course.getLicense()}`, { align: 'center' });
    }

    if (course.isAiAssisted()) {
      doc.moveDown(1);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(TEAL);
      doc.text(strings.aiNoticeTitle, { align: 'center' });
      doc.moveDown(0.2);
      doc.font('Helvetica').fontSize(9).fillColor(MUTED);
      doc.text(strings.aiNotice, { align: 'center' });
    }

    doc.moveDown(2);
    const dateText = context.generatedAt.toISOString().slice(0, 10);
    doc.fontSize(9).fillColor(MUTED);
    doc.text(
      strings.generatedNote.replace('{date}', dateText).replace('{url}', context.courseUrl),
      { align: 'center', link: undefined }
    );
    doc.moveDown(0.5);
    doc.text(`${strings.generatedWith} ${strings.aboutOpenKnowledge}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.text(strings.responsible.replace('{owner}', context.ownerName), { align: 'center' });

    // ---------------------------------------------------------------- //
    // Table of contents                                                 //
    // ---------------------------------------------------------------- //
    const materials = course
      .getSections()
      .getSections()
      .flatMap((section) => section.getMaterials().getMaterials());

    const bibliography = collectBibliography(course);
    const left = doc.page.margins.left;
    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const numberWidth = 36;
    const rowHeight = 14;
    // Entries are laid out now and get their page number backfilled once
    // the chapters have been rendered and real page numbers exist.
    const tocEntries: { pageIndex: number; y: number; destination: string }[] = [];
    const destinationPages = new Map<string, number>();
    const addTocRow = (label: string, destination: string, indent: number) => {
      if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) doc.addPage();
      const rowY = doc.y;
      tocEntries.push({ pageIndex: doc.bufferedPageRange().count - 1, y: rowY, destination });
      doc.text(label, left + indent, rowY, {
        width: contentWidth - indent - numberWidth,
        height: rowHeight,
        ellipsis: true,
      });
      doc.x = left;
      doc.moveDown(0.15);
    };

    doc.addPage();
    doc.font('Helvetica-Bold').fontSize(18).fillColor(INK).text(strings.toc);
    doc.moveDown(0.5);
    // Grouped by section: the logical structure of the course.
    let chapterNumber = 0;
    for (const section of course.getSections().getSections()) {
      doc.moveDown(0.4);
      doc.font('Helvetica-Bold').fontSize(12).fillColor(TEAL);
      doc.text(section.getTitle());
      doc.moveDown(0.2);
      doc.font('Helvetica').fontSize(11).fillColor(INK);
      for (const material of section.getMaterials().getMaterials()) {
        chapterNumber += 1;
        addTocRow(`${chapterNumber}. ${material.getTitle()}`, `chapter-${chapterNumber}`, 14);
      }
    }
    if (bibliography.length > 0) {
      doc.moveDown(0.4);
      doc.font('Helvetica-Bold').fontSize(12).fillColor(TEAL);
      addTocRow(strings.bibliography, 'bibliography', 0);
    }

    // ---------------------------------------------------------------- //
    // Chapters                                                          //
    // ---------------------------------------------------------------- //
    for (const [index, material] of materials.entries()) {
      doc.addPage();
      doc.addNamedDestination(`chapter-${index + 1}`);
      destinationPages.set(`chapter-${index + 1}`, doc.bufferedPageRange().count);
      doc.outline.addItem(material.getTitle());
      doc.font('Helvetica-Bold').fontSize(18).fillColor(INK);
      doc.text(`${index + 1}. ${material.getTitle()}`);
      doc.moveDown(0.8);
      this.renderMaterial(doc, material, context);
    }

    // ---------------------------------------------------------------- //
    // Bibliography & sources                                            //
    // ---------------------------------------------------------------- //
    if (bibliography.length > 0) {
      doc.addPage();
      doc.addNamedDestination('bibliography');
      destinationPages.set('bibliography', doc.bufferedPageRange().count);
      doc.outline.addItem(strings.bibliography);
      doc.font('Helvetica-Bold').fontSize(18).fillColor(INK);
      doc.text(strings.bibliography);
      doc.moveDown(0.8);
      for (const source of bibliography) {
        doc.font('Helvetica').fontSize(11).fillColor(INK);
        doc.text(`• ${source.title}`, { indent: 12, lineGap: 2 });
        if (source.url) {
          doc.font('Helvetica').fontSize(9.5).fillColor(TEAL);
          doc.text(source.url, { indent: 24, link: source.url, underline: true });
        }
        doc.moveDown(0.35);
      }
    }

    // ---------------------------------------------------------------- //
    // Backfill: TOC page numbers + links, page-number footers           //
    // ---------------------------------------------------------------- //
    doc.font('Helvetica').fontSize(10).fillColor(MUTED);
    for (const entry of tocEntries) {
      const pageNumber = destinationPages.get(entry.destination);
      if (!pageNumber) continue;
      doc.switchToPage(entry.pageIndex);
      doc.text(String(pageNumber), left + contentWidth - numberWidth, entry.y, {
        width: numberWidth,
        align: 'right',
        lineBreak: false,
      });
      doc.goTo(left, entry.y - 2, contentWidth, rowHeight + 2, entry.destination);
    }

    const range = doc.bufferedPageRange();
    doc.font('Helvetica').fontSize(9).fillColor(MUTED);
    // The cover is page 1 but stays unnumbered, as in print.
    for (let index = 1; index < range.count; index += 1) {
      doc.switchToPage(index);
      const bottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc.text(`${index + 1} / ${range.count}`, 0, doc.page.height - 40, {
        width: doc.page.width,
        align: 'center',
        lineBreak: false,
      });
      doc.page.margins.bottom = bottomMargin;
    }

    doc.end();
    return { data: await finished, mime: 'application/pdf', extension: 'pdf' };
  }

  /** pdfkit renders JPEG/PNG only; other formats are converted via sharp. */
  private async loadRasterImage(mediaPath: string | null): Promise<Buffer | null> {
    if (!mediaPath) return null;
    const stored = await this.mediaRepository.retrieve(mediaPath);
    if (!stored) return null;

    const extension = path.extname(mediaPath).toLowerCase();
    if (['.jpg', '.jpeg', '.png'].includes(extension)) return stored.data;
    try {
      return await sharp(stored.data, { density: 192 }).png().toBuffer();
    } catch {
      return null;
    }
  }

  private renderMaterial(doc: PDFKit.PDFDocument, material: Material, context: ExportContext) {
    if (material.getType() !== 'markdown') {
      const url = context.materialUrl(material.getId());
      doc.font('Helvetica').fontSize(11).fillColor(MUTED);
      doc.text(context.strings.consultOnline);
      doc.moveDown(0.3);
      doc.fillColor(TEAL).text(url, { link: url, underline: true });
      doc.moveDown(1);
      if (material.getMarkdown()) {
        this.renderMarkdown(doc, material.getMarkdown());
      }
      return;
    }
    this.renderMarkdown(doc, material.getMarkdown());
  }

  private renderMarkdown(doc: PDFKit.PDFDocument, markdown: string) {
    const tokens = marked.lexer(markdown);
    for (const token of tokens) {
      switch (token.type) {
        case 'heading': {
          const heading = token as Tokens.Heading;
          const size = heading.depth === 1 ? 16 : heading.depth === 2 ? 14 : 12;
          doc.moveDown(0.6);
          doc.font('Helvetica-Bold').fontSize(size).fillColor(INK);
          doc.text(inlineText(heading.tokens, heading.text));
          doc.moveDown(0.3);
          break;
        }
        case 'paragraph': {
          const paragraph = token as Tokens.Paragraph;
          doc.font('Helvetica').fontSize(11).fillColor(INK);
          doc.text(inlineText(paragraph.tokens, paragraph.text), { lineGap: 3 });
          doc.moveDown(0.5);
          break;
        }
        case 'list': {
          const list = token as Tokens.List;
          doc.font('Helvetica').fontSize(11).fillColor(INK);
          list.items.forEach((item, index) => {
            const bullet = list.ordered ? `${(Number(list.start) || 1) + index}.` : '•';
            doc.text(`${bullet} ${inlineText(item.tokens, item.text)}`, {
              indent: 12,
              lineGap: 2,
            });
          });
          doc.moveDown(0.5);
          break;
        }
        case 'blockquote': {
          const quote = token as Tokens.Blockquote;
          doc.font('Helvetica-Oblique').fontSize(11).fillColor(MUTED);
          doc.text(inlineText(quote.tokens, quote.text), { indent: 16, lineGap: 3 });
          doc.moveDown(0.5);
          break;
        }
        case 'code': {
          const code = token as Tokens.Code;
          doc.font('Courier').fontSize(9.5).fillColor(INK);
          doc.text(code.text, { indent: 12, lineGap: 2 });
          doc.moveDown(0.5);
          break;
        }
        case 'hr':
          doc.moveDown(0.5);
          doc
            .moveTo(doc.page.margins.left, doc.y)
            .lineTo(doc.page.width - doc.page.margins.right, doc.y)
            .strokeColor('#dfe6eb')
            .stroke();
          doc.moveDown(0.5);
          break;
        case 'space':
          break;
        default: {
          if ('text' in token && token.text) {
            doc.font('Helvetica').fontSize(11).fillColor(INK);
            doc.text(String(token.text), { lineGap: 3 });
            doc.moveDown(0.5);
          }
        }
      }
    }
  }
}
