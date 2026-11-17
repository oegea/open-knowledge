// Namespace import: fontkit's ES module build has no default export, so a
// default import is undefined once Next loads it as an external package.
import * as fontkit from 'fontkit';
import path from 'path';
import sharp, { type OverlayOptions } from 'sharp';

/**
 * Renders the EPUB's cover as a portrait JPEG — the format every reading
 * app and e-reader accepts for the library thumbnail (the course cover is
 * landscape and may be WebP/SVG/AVIF, which many readers cannot show).
 *
 * Layout: the brand's dark lagoon atmosphere, the course image as a framed
 * plate, then library name, title and authors set left-aligned.
 *
 * Lettering is drawn as vector outlines taken from the bundled fonts with
 * fontkit, never through the host's text stack: the cover comes out
 * identical on every machine, including containers with no fonts installed.
 */

const WIDTH = 1600;
const HEIGHT = 2400;
const MARGIN = 150;
const CONTENT_WIDTH = WIDTH - MARGIN * 2;
const PLATE_HEIGHT = 730;
const FOOTER_TOP = HEIGHT - 260;

const FONT_DIR = path.join(process.cwd(), 'src', 'modules', 'export', 'infrastructure', 'fonts');
const FONT_FILES = { bold: 'DejaVuSans-Bold.ttf', body: 'DejaVuSans.ttf' } as const;
type FontRole = keyof typeof FONT_FILES;

export interface EpubCoverProps {
  title: string;
  authors: string[];
  libraryName: string;
  /** Course cover in any format sharp can read, or null. */
  image: Buffer | null;
}

const fonts: Partial<Record<FontRole, fontkit.Font | null>> = {};

function loadFont(role: FontRole): fontkit.Font | null {
  if (fonts[role] === undefined) {
    try {
      const opened = fontkit.openSync(path.join(FONT_DIR, FONT_FILES[role]));
      fonts[role] = 'layout' in opened ? opened : null;
    } catch {
      fonts[role] = null;
    }
  }
  return fonts[role] ?? null;
}

/**
 * Whether the bundled fonts can draw every character. Scripts they lack
 * (CJK, for instance) would come out as empty boxes, so those covers go
 * without lettering — the title page that follows is set by the reading
 * app's own fonts and always shows the text.
 */
function canTypeset(text: string): boolean {
  const bold = loadFont('bold');
  const body = loadFont('body');
  if (!bold || !body) return false;
  return Array.from(text).every((character) => {
    const codePoint = character.codePointAt(0)!;
    return (
      codePoint <= 0x20 ||
      (bold.hasGlyphForCodePoint(codePoint) && body.hasGlyphForCodePoint(codePoint))
    );
  });
}

interface TextBlock {
  /** SVG markup positioned at the block's top-left corner. */
  svg: string;
  height: number;
}

interface TypesetOptions {
  /** Font size in pixels. */
  size: number;
  color: string;
  role: FontRole;
  /** Extra space between letters, in pixels. */
  tracking?: number;
  /** The block steps the size down until it fits this height. */
  maxHeight?: number;
}

/** Breaks text into lines of at most CONTENT_WIDTH and outlines them. */
function typeset(text: string, x: number, y: number, options: TypesetOptions): TextBlock {
  const font = loadFont(options.role)!;
  const tracking = options.tracking ?? 0;
  let size = options.size;

  for (;;) {
    const scale = size / font.unitsPerEm;
    const measure = (value: string) => {
      const run = font.layout(value);
      return run.advanceWidth * scale + tracking * run.glyphs.length;
    };

    const lines: string[] = [];
    let line = '';
    for (const word of text.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && measure(candidate) > CONTENT_WIDTH) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);

    const lineHeight = size * 1.16;
    const height = lines.length * lineHeight;
    const widest = Math.max(...lines.map(measure), 0);
    const fits = (!options.maxHeight || height <= options.maxHeight) && widest <= CONTENT_WIDTH;
    if (!fits && size > 34) {
      size *= 0.9;
      continue;
    }

    const ascent = (font.ascent / font.unitsPerEm) * size;
    const paths: string[] = [];
    lines.forEach((content, index) => {
      const run = font.layout(content);
      const baseline = y + ascent + index * lineHeight;
      let cursor = x;
      run.glyphs.forEach((glyph, glyphIndex) => {
        const position = run.positions[glyphIndex];
        const d = glyph.path.toSVG();
        if (d) {
          const gx = cursor + position.xOffset * scale;
          const gy = baseline - position.yOffset * scale;
          // Font outlines are y-up: flip them onto the SVG's y-down canvas.
          paths.push(
            `<path transform="translate(${gx.toFixed(2)} ${gy.toFixed(2)}) scale(${scale.toFixed(5)} ${(-scale).toFixed(5)})" d="${d}"/>`
          );
        }
        cursor += position.xAdvance * scale + tracking;
      });
    });

    return { svg: `<g fill="${options.color}">${paths.join('')}</g>`, height };
  }
}

function coverSvg(lettering: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <defs>
    <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b1117"/>
      <stop offset="0.55" stop-color="#10343b"/>
      <stop offset="1" stop-color="#12424a"/>
    </linearGradient>
    <radialGradient id="lagoon" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#38bdc2" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#38bdc2" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="ember" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#e79b23" stop-opacity="0.42"/>
      <stop offset="1" stop-color="#e79b23" stop-opacity="0"/>
    </radialGradient>
    <pattern id="dots" width="44" height="44" patternUnits="userSpaceOnUse">
      <circle cx="4" cy="4" r="2.4" fill="#6fd8d8" fill-opacity="0.2"/>
    </pattern>
    <radialGradient id="dotFade" cx="0.85" cy="0.1" r="0.8">
      <stop offset="0" stop-color="#fff"/>
      <stop offset="0.75" stop-color="#000"/>
    </radialGradient>
    <mask id="dotMask"><rect width="${WIDTH}" height="${HEIGHT}" fill="url(#dotFade)"/></mask>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#38bdc2"/>
      <stop offset="1" stop-color="#f7c46d"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#base)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#dots)" mask="url(#dotMask)"/>
  <circle cx="1500" cy="260" r="900" fill="url(#lagoon)"/>
  <circle cx="60" cy="2300" r="1000" fill="url(#ember)"/>
  <circle cx="1330" cy="2260" r="430" fill="none" stroke="#6fd8d8" stroke-opacity="0.2" stroke-width="3"/>
  <circle cx="1330" cy="2260" r="620" fill="none" stroke="#6fd8d8" stroke-opacity="0.1" stroke-width="3"/>
  <rect x="${MARGIN}" y="${FOOTER_TOP}" width="${CONTENT_WIDTH}" height="2" fill="#ffffff" fill-opacity="0.18"/>
  ${lettering}
</svg>`;
}

/** The course image as a rounded plate with a soft shadow beneath it. */
async function plate(image: Buffer): Promise<{ plate: Buffer; shadow: Buffer } | null> {
  try {
    const radius = 36;
    const mask = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${CONTENT_WIDTH}" height="${PLATE_HEIGHT}"><rect width="${CONTENT_WIDTH}" height="${PLATE_HEIGHT}" rx="${radius}" ry="${radius}"/></svg>`
    );
    const rounded = await sharp(image, { density: 144 })
      .resize(CONTENT_WIDTH, PLATE_HEIGHT, { fit: 'cover' })
      .composite([{ input: mask, blend: 'dest-in' }])
      .png()
      .toBuffer();
    const pad = 90;
    const shadow = await sharp(
      Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${CONTENT_WIDTH + pad * 2}" height="${PLATE_HEIGHT + pad * 2}"><rect x="${pad}" y="${pad}" width="${CONTENT_WIDTH}" height="${PLATE_HEIGHT}" rx="${radius}" ry="${radius}" fill="#000" fill-opacity="0.55"/></svg>`
      )
    )
      .blur(34)
      .png()
      .toBuffer();
    return { plate: rounded, shadow };
  } catch {
    return null;
  }
}

export async function renderEpubCover({
  title,
  authors,
  libraryName,
  image,
}: EpubCoverProps): Promise<Buffer> {
  const layers: OverlayOptions[] = [];
  const lettering: string[] = [];

  let cursor = 210;
  const framed = image ? await plate(image) : null;
  if (framed) {
    layers.push({ input: framed.shadow, left: MARGIN - 90, top: cursor - 90 + 36 });
    layers.push({ input: framed.plate, left: MARGIN, top: cursor });
    cursor += PLATE_HEIGHT + 150;
  } else {
    // No image: the lettering carries the cover, set lower on the page.
    cursor = 900;
  }

  const authorLine = authors.join(', ');
  if (canTypeset(`${title}${authorLine}${libraryName}`)) {
    const kicker = typeset(libraryName.toUpperCase(), MARGIN, cursor, {
      size: 40,
      color: '#6fd8d8',
      role: 'bold',
      tracking: 6,
      maxHeight: 100,
    });
    lettering.push(kicker.svg);
    cursor += kicker.height + 40;

    lettering.push(
      `<rect x="${MARGIN}" y="${cursor}" width="220" height="10" rx="5" fill="url(#rule)"/>`
    );
    cursor += 10 + 64;

    // Title and authors share whatever is left above the footer rule.
    const authorsRoom = authorLine ? 190 : 0;
    const titleRoom = Math.max(FOOTER_TOP - 80 - cursor - authorsRoom, 220);
    const titleSize = title.length <= 28 ? 132 : title.length <= 60 ? 108 : 86;
    const titleBlock = typeset(title, MARGIN, cursor, {
      size: titleSize,
      color: '#ffffff',
      role: 'bold',
      maxHeight: titleRoom,
    });
    lettering.push(titleBlock.svg);
    cursor += titleBlock.height + 44;

    if (authorLine) {
      const authorsBlock = typeset(authorLine, MARGIN, cursor, {
        size: 50,
        color: '#c3cdd6',
        role: 'body',
        maxHeight: 130,
      });
      if (cursor + authorsBlock.height < FOOTER_TOP - 30) lettering.push(authorsBlock.svg);
    }

    lettering.push(
      typeset(libraryName, MARGIN, FOOTER_TOP + 70, {
        size: 40,
        color: '#eef2f5',
        role: 'bold',
        maxHeight: 50,
      }).svg
    );
  }

  // The plate sits between the backdrop and the lettering, which never
  // overlap it, so one composite over the full SVG is enough.
  return await sharp(Buffer.from(coverSvg(lettering.join('\n'))))
    .composite(layers)
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
}
