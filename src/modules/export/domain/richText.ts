import type { Token, Tokens } from 'marked';

/**
 * A run of text with uniform styling, extracted from marked inline tokens.
 * Renderers (PDF) map each segment to a font/color/decoration change.
 */
export interface InlineSegment {
  text: string;
  bold: boolean;
  italic: boolean;
  code: boolean;
  strike: boolean;
  link: string | null;
}

interface SegmentStyle {
  bold: boolean;
  italic: boolean;
  code: boolean;
  strike: boolean;
  link: string | null;
}

const PLAIN: SegmentStyle = { bold: false, italic: false, code: false, strike: false, link: null };

function collect(tokens: Token[], style: SegmentStyle, out: InlineSegment[]): void {
  for (const token of tokens) {
    switch (token.type) {
      case 'strong':
        collect((token as Tokens.Strong).tokens ?? [], { ...style, bold: true }, out);
        break;
      case 'em':
        collect((token as Tokens.Em).tokens ?? [], { ...style, italic: true }, out);
        break;
      case 'del':
        collect((token as Tokens.Del).tokens ?? [], { ...style, strike: true }, out);
        break;
      case 'link': {
        const link = token as Tokens.Link;
        collect(link.tokens ?? [], { ...style, link: link.href }, out);
        break;
      }
      case 'codespan':
        out.push({ ...style, code: true, text: (token as Tokens.Codespan).text });
        break;
      case 'image':
        out.push({ ...style, text: (token as Tokens.Image).text ?? '' });
        break;
      case 'br':
        out.push({ ...style, text: '\n' });
        break;
      case 'escape':
        out.push({ ...style, text: (token as Tokens.Escape).text });
        break;
      case 'html':
        // Inline HTML tokens are the tags themselves; their visible content
        // arrives as separate text tokens, so tags are dropped.
        break;
      default: {
        // Block-level containers reached from list items or blockquotes
        // (text/paragraph) carry the parsed inline run in `tokens`; only
        // leaves without one fall back to their literal text.
        const nested = 'tokens' in token ? (token as Tokens.Text).tokens : undefined;
        if (nested && nested.length > 0) {
          collect(nested, style, out);
        } else if ('text' in token && token.text) {
          out.push({ ...style, text: String((token as Tokens.Text).text) });
        }
      }
    }
  }
}

/** Merges adjacent segments with identical styling into a single run. */
function merge(segments: InlineSegment[]): InlineSegment[] {
  const merged: InlineSegment[] = [];
  for (const segment of segments) {
    if (segment.text.length === 0) continue;
    const last = merged[merged.length - 1];
    if (
      last &&
      last.bold === segment.bold &&
      last.italic === segment.italic &&
      last.code === segment.code &&
      last.strike === segment.strike &&
      last.link === segment.link
    ) {
      last.text += segment.text;
    } else {
      merged.push({ ...segment });
    }
  }
  return merged;
}

/**
 * Flattens marked inline tokens into styled segments, recursing through the
 * block-level wrappers (text, paragraph) that list items and blockquotes
 * put around their inline runs.
 */
export function inlineSegments(
  tokens: Token[] | undefined,
  style: Partial<SegmentStyle> = {}
): InlineSegment[] {
  if (!tokens) return [];
  const out: InlineSegment[] = [];
  collect(tokens, { ...PLAIN, ...style }, out);
  return merge(out);
}

/** Plain-text projection of an inline run (TOC rows, alt fallbacks). */
export function inlinePlainText(tokens: Token[] | undefined, fallback = ''): string {
  const text = inlineSegments(tokens)
    .map((segment) => segment.text)
    .join('');
  return text.length > 0 ? text : fallback;
}
