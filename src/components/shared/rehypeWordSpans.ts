/**
 * Rehype plugin that wraps every whitespace-delimited word of the rendered
 * Markdown in `<span data-word="n">`, numbered in document order. It gives
 * the study view stable, React-owned anchors to highlight the word being
 * narrated (see NarratedProse) without touching the DOM behind React's back.
 *
 * Written against the plain hast shape to avoid pulling utility packages
 * into the client bundle.
 */

interface HastText {
  type: 'text';
  value: string;
}

interface HastElement {
  type: 'element';
  tagName: string;
  properties?: Record<string, unknown>;
  children: HastNode[];
}

interface HastParent {
  type: string;
  children?: HastNode[];
}

type HastNode = HastText | HastElement | HastParent;

export const WORD_ATTRIBUTE = 'data-word';

/** Elements whose text is never narrated word by word. */
const SKIPPED_TAGS = new Set(['script', 'style']);

export interface RehypeWordSpansOptions {
  /**
   * Bionic reading: bold the fixation prefix of every word (the first ~40%
   * of its letters), guiding the eye through the text. The second facet of
   * the speed-reading concept, next to the RSVP reader (ADR 0019).
   */
  bionic?: boolean;
}

/**
 * Letters of a word's core (surrounding punctuation ignored) that form the
 * bionic fixation prefix: ~40% of the word, at least one letter.
 */
export function bionicPrefixLength(text: string): number {
  const leading = text.match(/^[^\p{L}\p{N}]+/u)?.[0].length ?? 0;
  const trailing = text.match(/[^\p{L}\p{N}]+$/u)?.[0].length ?? 0;
  const coreLength = text.length - leading - trailing;
  if (coreLength <= 0) return 0;
  return Math.max(1, Math.ceil(coreLength * 0.4));
}

/** Children of a word span: plain text, or split around the bold prefix. */
function wordChildren(text: string, bionic: boolean): HastNode[] {
  const prefixLength = bionic ? bionicPrefixLength(text) : 0;
  if (prefixLength === 0) return [{ type: 'text', value: text }];
  const leading = text.match(/^[^\p{L}\p{N}]+/u)?.[0].length ?? 0;
  const children: HastNode[] = [];
  if (leading > 0) children.push({ type: 'text', value: text.slice(0, leading) });
  children.push({
    type: 'element',
    tagName: 'b',
    properties: {},
    children: [{ type: 'text', value: text.slice(leading, leading + prefixLength) }],
  });
  if (leading + prefixLength < text.length) {
    children.push({ type: 'text', value: text.slice(leading + prefixLength) });
  }
  return children;
}

export function rehypeWordSpans(options: RehypeWordSpansOptions = {}) {
  const bionic = options.bionic ?? false;
  return (tree: HastParent) => {
    let counter = 0;

    const visit = (node: HastParent | HastElement) => {
      if (!node.children) return;
      const next: HastNode[] = [];
      for (const child of node.children) {
        if (child.type === 'text') {
          for (const piece of splitWords((child as HastText).value)) {
            if (piece.word) {
              next.push({
                type: 'element',
                tagName: 'span',
                properties: { dataWord: String(counter++) },
                children: wordChildren(piece.text, bionic),
              });
            } else {
              next.push({ type: 'text', value: piece.text });
            }
          }
        } else {
          if (child.type === 'element' && !SKIPPED_TAGS.has((child as HastElement).tagName)) {
            visit(child as HastElement);
          }
          next.push(child);
        }
      }
      node.children = next;
    };

    visit(tree);
  };
}

/** Splits text into alternating word / whitespace pieces, preserving both. */
export function splitWords(text: string): { text: string; word: boolean }[] {
  const pieces: { text: string; word: boolean }[] = [];
  const pattern = /\S+|\s+/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    pieces.push({ text: match[0], word: /\S/.test(match[0]) });
  }
  return pieces;
}
