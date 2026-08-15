import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import fontkit from 'fontkit';
import fs from 'fs';
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
import { inlineSegments, inlinePlainText, InlineSegment } from '../domain/richText';
import { MediaRepository } from '../../media/domain/MediaRepository';
import { FilesystemMediaRepository } from '../../media/infrastructure/FilesystemMediaRepository';

const TEAL = '#0e7c86';
const INK = '#131a21';
const MUTED = '#66757f';
const RULE = '#dfe6eb';
const CODE_BG = '#f3f6f8';

// DejaVu (free license, wide Unicode coverage) ships with the module so the
// PDF is not limited to pdfkit's WinAnsi built-ins, which corrupt any
// character outside Latin-1 (e.g. "→" came out as "!’").
const FONT_DIR = path.join(process.cwd(), 'src', 'modules', 'export', 'infrastructure', 'fonts');
const FONT_FILES = {
  body: 'DejaVuSans.ttf',
  bold: 'DejaVuSans-Bold.ttf',
  italic: 'DejaVuSans-Oblique.ttf',
  boldItalic: 'DejaVuSans-BoldOblique.ttf',
  mono: 'DejaVuSansMono.ttf',
} as const;

type FontRole = keyof typeof FONT_FILES;
type FontSet = Record<FontRole, string>;

const BUILTIN_FONTS: FontSet = {
  body: 'Helvetica',
  bold: 'Helvetica-Bold',
  italic: 'Helvetica-Oblique',
  boldItalic: 'Helvetica-BoldOblique',
  mono: 'Courier',
};

// Zero-width joiners and variation selectors are invisible but map to no
// glyph, so they always get stripped before rendering.
const INVISIBLE_MODIFIERS = /[\u200D\uFE00-\uFE0F]/g;
const PICTOGRAPH = /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}]/u;

// Codepoints above 0xFF that WinAnsi (the built-in font fallback) still maps.
const WIN_ANSI_EXTRA = new Set([
  0x152, 0x153, 0x160, 0x161, 0x178, 0x17d, 0x17e, 0x192, 0x2c6, 0x2dc, 0x2013, 0x2014, 0x2018,
  0x2019, 0x201a, 0x201c, 0x201d, 0x201e, 0x2020, 0x2021, 0x2022, 0x2026, 0x2030, 0x2039, 0x203a,
  0x20ac, 0x2122,
]);

let coverageFont: fontkit.Font | null | undefined;
const glyphDecisions = new Map<number, boolean>();

/** Whether the embedded body font can draw the given codepoint. */
function fontHasGlyph(codePoint: number): boolean {
  if (coverageFont === undefined) {
    try {
      const opened = fontkit.openSync(path.join(FONT_DIR, FONT_FILES.body));
      coverageFont = 'hasGlyphForCodePoint' in opened ? opened : null;
    } catch {
      coverageFont = null;
    }
  }
  if (!coverageFont) return false;
  let decision = glyphDecisions.get(codePoint);
  if (decision === undefined) {
    decision = coverageFont.hasGlyphForCodePoint(codePoint);
    glyphDecisions.set(codePoint, decision);
  }
  return decision;
}

interface SegmentOptions {
  size: number;
  color?: string;
  lineGap?: number;
  paragraphGap?: number;
}

export class PdfCourseExportRepository implements CourseExportRepository {
  private fonts: FontSet = BUILTIN_FONTS;
  private embeddedFonts = false;

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
    this.registerFonts(doc);
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    const finished = new Promise<Buffer>((resolve) =>
      doc.on('end', () => resolve(Buffer.concat(chunks)))
    );

    await this.renderCover(doc, course, context);
    doc.addPage();
    this.renderCredits(doc, course, context);

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
      doc.text(this.clean(label), left + indent, rowY, {
        width: contentWidth - indent - numberWidth,
        height: rowHeight,
        ellipsis: true,
      });
      doc.x = left;
      doc.moveDown(0.15);
    };

    doc.addPage();
    doc.font(this.fonts.bold).fontSize(18).fillColor(INK).text(this.clean(strings.toc));
    doc.moveDown(0.5);
    // Grouped by section: the logical structure of the course.
    let chapterNumber = 0;
    for (const section of course.getSections().getSections()) {
      doc.moveDown(0.4);
      doc.font(this.fonts.bold).fontSize(12).fillColor(TEAL);
      doc.text(this.clean(section.getTitle()));
      doc.moveDown(0.2);
      doc.font(this.fonts.body).fontSize(11).fillColor(INK);
      for (const material of section.getMaterials().getMaterials()) {
        chapterNumber += 1;
        addTocRow(`${chapterNumber}. ${material.getTitle()}`, `chapter-${chapterNumber}`, 14);
      }
    }
    if (bibliography.length > 0) {
      doc.moveDown(0.4);
      doc.font(this.fonts.bold).fontSize(12).fillColor(TEAL);
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
      doc.font(this.fonts.bold).fontSize(18).fillColor(INK);
      doc.text(this.clean(`${index + 1}. ${material.getTitle()}`));
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
      doc.font(this.fonts.bold).fontSize(18).fillColor(INK);
      doc.text(this.clean(strings.bibliography));
      doc.moveDown(0.8);
      // Hanging indent: wrapped lines align with the entry text, not the bullet.
      const bulletX = left + 12;
      const entryX = bulletX + 14;
      const entryWidth = contentWidth - (entryX - left);
      for (const source of bibliography) {
        doc.font(this.fonts.body).fontSize(11).fillColor(INK);
        const titleHeight = doc.heightOfString(this.clean(source.title), {
          width: entryWidth,
          lineGap: 2,
        });
        if (doc.y + titleHeight + 16 > doc.page.height - doc.page.margins.bottom) doc.addPage();
        const rowY = doc.y;
        doc.text('•', bulletX, rowY, { lineBreak: false });
        doc.text(this.clean(source.title), entryX, rowY, { width: entryWidth, lineGap: 2 });
        if (source.url) {
          doc.font(this.fonts.body).fontSize(9.5).fillColor(TEAL);
          doc.text(this.clean(source.url), entryX, doc.y, {
            width: entryWidth,
            link: source.url,
            underline: true,
          });
        }
        doc.x = left;
        doc.moveDown(0.35);
      }
    }

    // ---------------------------------------------------------------- //
    // Backfill: TOC page numbers + links, page-number footers           //
    // ---------------------------------------------------------------- //
    doc.font(this.fonts.body).fontSize(10).fillColor(MUTED);
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
    doc.font(this.fonts.body).fontSize(9).fillColor(MUTED);
    // Cover and credits are front matter and stay unnumbered, as in print.
    for (let index = 2; index < range.count; index += 1) {
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

  // ------------------------------------------------------------------ //
  // Cover & credits (front matter)                                      //
  // ------------------------------------------------------------------ //

  /** Page 1, book style: cover image, title, authors and publisher footer. */
  private async renderCover(doc: PDFKit.PDFDocument, course: Course, context: ExportContext) {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const left = doc.page.margins.left;
    const contentWidth = pageWidth - doc.page.margins.left - doc.page.margins.right;
    const footerTop = pageHeight - 156;

    const cover = await this.loadRasterImage(context.coverMediaPath);
    let cursor = 96;
    if (cover) {
      const imageHeight = 300;
      doc.image(cover, left, cursor, {
        fit: [contentWidth, imageHeight],
        align: 'center',
        valign: 'center',
      });
      cursor += imageHeight + 56;
    } else {
      cursor = 264;
    }

    const title = this.clean(course.getTitle());
    const titleSize = title.length > 90 ? 22 : 28;
    doc.font(this.fonts.bold).fontSize(titleSize).fillColor(INK);
    doc.text(title, left, cursor, { width: contentWidth, align: 'center' });

    if (course.getAuthors().length > 0) {
      doc.moveDown(0.8);
      doc.font(this.fonts.body).fontSize(13).fillColor(MUTED);
      doc.text(this.clean(course.getAuthors().join(', ')), { width: contentWidth, align: 'center' });
    }

    // Publisher footer: rule, logo (or library name) and site URL. It sits
    // inside the bottom margin, which is lifted while drawing so pdfkit
    // does not spill onto an extra page.
    const bottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc
      .moveTo(left + contentWidth / 2 - 90, footerTop)
      .lineTo(left + contentWidth / 2 + 90, footerTop)
      .strokeColor(RULE)
      .stroke();

    const logo = await this.loadRasterImage(context.logoMediaPath);
    let brandCursor = footerTop + 22;
    if (logo) {
      doc.image(logo, pageWidth / 2 - 60, brandCursor, {
        fit: [120, 36],
        align: 'center',
        valign: 'center',
      });
      brandCursor += 46;
    }
    doc.font(this.fonts.bold).fontSize(11).fillColor(INK);
    doc.text(this.clean(context.libraryName), left, brandCursor, {
      width: contentWidth,
      align: 'center',
      lineBreak: false,
    });
    doc.font(this.fonts.body).fontSize(9.5).fillColor(MUTED);
    doc.text(this.libraryUrl(context), left, brandCursor + 18, {
      width: contentWidth,
      align: 'center',
      lineBreak: false,
    });
    doc.page.margins.bottom = bottomMargin;
  }

  /** Page 2, the credits/copyright page: description, notices, colophon. */
  private renderCredits(doc: PDFKit.PDFDocument, course: Course, context: ExportContext) {
    const { strings } = context;
    const left = doc.page.margins.left;
    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc.font(this.fonts.body).fontSize(11.5).fillColor(INK);
    doc.text(this.clean(course.getDescription()), left, doc.page.margins.top, {
      width: contentWidth,
      lineGap: 3,
    });
    doc.moveDown(1.2);

    doc.font(this.fonts.body).fontSize(10).fillColor(MUTED);
    if (course.getAuthors().length > 0) {
      doc.text(this.clean(`${strings.authors}: ${course.getAuthors().join(', ')}`), {
        lineGap: 2,
      });
      doc.moveDown(0.3);
    }
    if (course.getLicense()) {
      doc.text(this.clean(`${strings.license}: ${course.getLicense()}`), { lineGap: 2 });
      doc.moveDown(0.3);
    }

    if (course.isAiAssisted()) {
      doc.moveDown(0.8);
      doc.font(this.fonts.bold).fontSize(10).fillColor(TEAL);
      doc.text(this.clean(strings.aiNoticeTitle));
      doc.moveDown(0.2);
      doc.font(this.fonts.body).fontSize(9.5).fillColor(MUTED);
      doc.text(this.clean(strings.aiNotice), { lineGap: 2 });
    }

    // Colophon pinned to the bottom of the page, as in printed books.
    const dateText = context.generatedAt.toISOString().slice(0, 10);
    const colophon = [
      strings.generatedNote.replace('{date}', dateText).replace('{url}', context.courseUrl),
      `${strings.generatedWith} ${strings.aboutOpenKnowledge}`,
      strings.responsible.replace('{owner}', context.ownerName),
    ].map((line) => this.clean(line));

    doc.font(this.fonts.body).fontSize(9).fillColor(MUTED);
    const spacing = 8;
    const totalHeight = colophon.reduce(
      (sum, line) => sum + doc.heightOfString(line, { width: contentWidth, lineGap: 2 }) + spacing,
      0
    );
    let cursor = doc.page.height - doc.page.margins.bottom - totalHeight;
    for (const line of colophon) {
      doc.text(line, left, cursor, { width: contentWidth, lineGap: 2 });
      cursor = doc.y + spacing;
    }
  }

  private libraryUrl(context: ExportContext): string {
    try {
      return new URL(context.courseUrl).origin;
    } catch {
      return context.courseUrl;
    }
  }

  // ------------------------------------------------------------------ //
  // Fonts & text sanitation                                             //
  // ------------------------------------------------------------------ //

  private registerFonts(doc: PDFKit.PDFDocument) {
    const paths = Object.fromEntries(
      (Object.keys(FONT_FILES) as FontRole[]).map((role) => [
        role,
        path.join(FONT_DIR, FONT_FILES[role]),
      ])
    ) as Record<FontRole, string>;
    this.embeddedFonts = Object.values(paths).every((fontPath) => fs.existsSync(fontPath));
    if (!this.embeddedFonts) {
      this.fonts = BUILTIN_FONTS;
      return;
    }
    const fonts = {} as FontSet;
    for (const role of Object.keys(FONT_FILES) as FontRole[]) {
      const name = `ok-${role}`;
      doc.registerFont(name, paths[role]);
      fonts[role] = name;
    }
    this.fonts = fonts;
  }

  /**
   * Drops characters the font cannot draw. With the embedded fonts only
   * uncovered pictographs (color emoji) are removed; with the WinAnsi
   * built-ins anything outside Latin-1 would corrupt the byte stream, so it
   * is replaced instead.
   */
  private clean(text: string): string {
    const stripped = text.replace(INVISIBLE_MODIFIERS, '');
    let out = '';
    let dropped = false;
    for (const char of stripped) {
      const codePoint = char.codePointAt(0)!;
      if (this.embeddedFonts) {
        if (PICTOGRAPH.test(char) && !fontHasGlyph(codePoint)) {
          dropped = true;
          continue;
        }
        // A removed pictograph leaves a double space behind; collapse it.
        if (dropped && char === ' ' && out.endsWith(' ')) {
          dropped = false;
          continue;
        }
        dropped = false;
        out += char;
      } else {
        out += codePoint <= 0xff || WIN_ANSI_EXTRA.has(codePoint) ? char : '?';
      }
    }
    return out;
  }

  private fontFor(segment: InlineSegment): string {
    if (segment.code) return this.fonts.mono;
    if (segment.bold && segment.italic) return this.fonts.boldItalic;
    if (segment.bold) return this.fonts.bold;
    if (segment.italic) return this.fonts.italic;
    return this.fonts.body;
  }

  /** Renders a styled inline run as one flowing paragraph. */
  private renderSegments(
    doc: PDFKit.PDFDocument,
    segments: InlineSegment[],
    options: SegmentOptions
  ) {
    const printable = segments
      .map((segment) => ({ ...segment, text: this.clean(segment.text) }))
      .filter((segment) => segment.text.length > 0);
    if (printable.length === 0) return;
    printable.forEach((segment, index) => {
      doc
        .font(this.fontFor(segment))
        .fontSize(segment.code ? options.size - 0.5 : options.size)
        .fillColor(segment.link ? TEAL : (options.color ?? INK));
      // Options are passed in full on every chunk: continued text keeps the
      // previous chunk's options as defaults, so link/underline/strike must
      // be reset explicitly or they bleed into the following segments.
      doc.text(segment.text, {
        continued: index < printable.length - 1,
        lineGap: options.lineGap ?? 3,
        underline: segment.link !== null,
        strike: segment.strike,
        link: segment.link ?? undefined,
      });
    });
  }

  // ------------------------------------------------------------------ //
  // Media & markdown content                                            //
  // ------------------------------------------------------------------ //

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
      doc.font(this.fonts.body).fontSize(11).fillColor(MUTED);
      doc.text(this.clean(context.strings.consultOnline));
      doc.moveDown(0.3);
      doc.fillColor(TEAL).text(this.clean(url), { link: url, underline: true });
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
    this.renderBlocks(doc, tokens, { indent: 0, quote: false });
  }

  private renderBlocks(
    doc: PDFKit.PDFDocument,
    tokens: Token[],
    context: { indent: number; quote: boolean }
  ) {
    const left = doc.page.margins.left;
    for (const token of tokens) {
      switch (token.type) {
        case 'heading': {
          const heading = token as Tokens.Heading;
          const size = heading.depth === 1 ? 16 : heading.depth === 2 ? 14 : 12;
          doc.moveDown(0.6);
          doc.x = left + context.indent;
          this.renderSegments(doc, inlineSegments(heading.tokens, { bold: true }), {
            size,
            color: context.quote ? MUTED : INK,
          });
          doc.moveDown(0.3);
          break;
        }
        case 'paragraph': {
          const paragraph = token as Tokens.Paragraph;
          doc.x = left + context.indent;
          this.renderSegments(doc, inlineSegments(paragraph.tokens, { italic: context.quote }), {
            size: 11,
            color: context.quote ? MUTED : INK,
          });
          doc.moveDown(0.5);
          break;
        }
        case 'list':
          this.renderList(doc, token as Tokens.List, context);
          doc.moveDown(0.5);
          break;
        case 'blockquote': {
          const quote = token as Tokens.Blockquote;
          const startPage = doc.bufferedPageRange().count;
          const startY = doc.y;
          this.renderBlocks(doc, quote.tokens ?? [], {
            indent: context.indent + 18,
            quote: true,
          });
          // Teal accent bar, only when the quote did not cross a page break.
          if (doc.bufferedPageRange().count === startPage && doc.y > startY) {
            doc
              .moveTo(left + context.indent + 6, startY + 2)
              .lineTo(left + context.indent + 6, doc.y - 6)
              .strokeColor(TEAL)
              .lineWidth(2)
              .stroke()
              .lineWidth(1);
          }
          doc.x = left + context.indent;
          break;
        }
        case 'code': {
          const code = token as Tokens.Code;
          const text = this.clean(code.text);
          const codeX = left + context.indent + 10;
          const codeWidth =
            doc.page.width - doc.page.margins.right - codeX - 10;
          doc.font(this.fonts.mono).fontSize(9.5);
          const height = doc.heightOfString(text, { width: codeWidth, lineGap: 2 });
          const fits =
            doc.y + height + 12 < doc.page.height - doc.page.margins.bottom;
          if (fits) {
            doc
              .roundedRect(left + context.indent, doc.y - 4, codeWidth + 20, height + 12, 4)
              .fill(CODE_BG);
            doc.fillColor(INK);
            doc.text(text, codeX, doc.y + 2, { width: codeWidth, lineGap: 2 });
            doc.y += 8;
          } else {
            doc.fillColor(INK);
            doc.text(text, codeX, doc.y, { width: codeWidth, lineGap: 2 });
          }
          doc.x = left + context.indent;
          doc.moveDown(0.5);
          break;
        }
        case 'table':
          this.renderTable(doc, token as Tokens.Table, context.indent);
          break;
        case 'hr':
          doc.moveDown(0.5);
          doc
            .moveTo(left + context.indent, doc.y)
            .lineTo(doc.page.width - doc.page.margins.right, doc.y)
            .strokeColor(RULE)
            .stroke();
          doc.moveDown(0.5);
          break;
        case 'space':
          break;
        case 'html':
          // Raw HTML blocks have no faithful PDF rendering; skipped.
          break;
        default: {
          const segments = inlineSegments([token]);
          if (segments.length > 0) {
            doc.x = left + context.indent;
            this.renderSegments(doc, segments, { size: 11 });
            doc.moveDown(0.5);
          }
        }
      }
    }
    doc.x = left;
  }

  private renderList(
    doc: PDFKit.PDFDocument,
    list: Tokens.List,
    context: { indent: number; quote: boolean }
  ) {
    const left = doc.page.margins.left;
    list.items.forEach((item, index) => {
      const bullet = item.task
        ? item.checked
          ? '☑'
          : '☐'
        : list.ordered
          ? `${(Number(list.start) || 1) + index}.`
          : '•';
      const bulletX = left + context.indent + 12;
      const textX = bulletX + Math.max(16, doc.widthOfString(bullet) + 6);

      // Nested blocks in the item (extra paragraphs, sub-lists) hang below
      // the bullet, aligned with the item text.
      let firstLine = true;
      for (const child of item.tokens ?? []) {
        if (child.type === 'list') {
          doc.x = left;
          this.renderBlocks(doc, [child], { ...context, indent: context.indent + 18 });
          continue;
        }
        const segments = inlineSegments([child], { italic: context.quote });
        if (segments.length === 0) continue;
        if (doc.y + 14 > doc.page.height - doc.page.margins.bottom) doc.addPage();
        const rowY = doc.y;
        if (firstLine) {
          doc.font(this.fonts.body).fontSize(11).fillColor(context.quote ? MUTED : INK);
          doc.text(this.clean(bullet), bulletX, rowY, { lineBreak: false });
          firstLine = false;
        }
        doc.x = textX;
        doc.y = rowY;
        this.renderSegments(doc, segments, {
          size: 11,
          color: context.quote ? MUTED : INK,
          lineGap: 2,
        });
        doc.moveDown(0.15);
      }
      doc.x = left;
    });
  }

  /** Minimal table: plain-text cells in a fluid grid, bold header row. */
  private renderTable(doc: PDFKit.PDFDocument, table: Tokens.Table, indent: number) {
    const left = doc.page.margins.left + indent;
    const width = doc.page.width - doc.page.margins.right - left;
    const columns = table.header.length;
    if (columns === 0) return;
    const columnWidth = width / columns;

    const renderRow = (cells: Tokens.TableCell[], header: boolean) => {
      doc.font(header ? this.fonts.bold : this.fonts.body).fontSize(9.5);
      const texts = cells.map((cell) => this.clean(inlinePlainText(cell.tokens, cell.text)));
      const height = Math.max(
        ...texts.map((text) => doc.heightOfString(text, { width: columnWidth - 10, lineGap: 1 })),
        12
      );
      if (doc.y + height + 8 > doc.page.height - doc.page.margins.bottom) doc.addPage();
      const rowY = doc.y;
      texts.forEach((text, column) => {
        doc.fillColor(header ? INK : MUTED);
        doc.text(text, left + column * columnWidth, rowY, {
          width: columnWidth - 10,
          lineGap: 1,
        });
      });
      doc.y = rowY + height + 4;
      doc
        .moveTo(left, doc.y)
        .lineTo(left + width, doc.y)
        .strokeColor(RULE)
        .stroke();
      doc.y += 4;
    };

    doc.moveDown(0.3);
    renderRow(table.header, true);
    for (const row of table.rows) renderRow(row, false);
    doc.x = doc.page.margins.left;
    doc.moveDown(0.5);
  }
}
