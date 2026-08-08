import PDFDocument from 'pdfkit';
import { marked, type Token, type Tokens } from 'marked';
import path from 'path';
import { Course } from '../../course/domain/Course';
import { Material } from '../../course/domain/Material';
import {
  CourseExportRepository,
  ExportContext,
  ExportedDocument,
} from '../domain/CourseExportRepository';
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
      doc.moveDown(3);
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

    doc.addPage();
    doc.font('Helvetica-Bold').fontSize(18).fillColor(INK).text(strings.toc);
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(11).fillColor(INK);
    materials.forEach((material, index) => {
      doc.text(`${index + 1}. ${material.getTitle()}`);
      doc.moveDown(0.2);
    });

    // ---------------------------------------------------------------- //
    // Chapters                                                          //
    // ---------------------------------------------------------------- //
    for (const [index, material] of materials.entries()) {
      doc.addPage();
      doc.font('Helvetica-Bold').fontSize(18).fillColor(INK);
      doc.text(`${index + 1}. ${material.getTitle()}`);
      doc.moveDown(0.8);
      this.renderMaterial(doc, material, context);
    }

    doc.end();
    return { data: await finished, mime: 'application/pdf', extension: 'pdf' };
  }

  /** pdfkit renders JPEG/PNG only; anything else falls back gracefully. */
  private async loadRasterImage(mediaPath: string | null): Promise<Buffer | null> {
    if (!mediaPath) return null;
    const extension = path.extname(mediaPath).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(extension)) return null;
    const stored = await this.mediaRepository.retrieve(mediaPath);
    return stored?.data ?? null;
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
