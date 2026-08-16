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

export function rehypeWordSpans() {
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
                children: [{ type: 'text', value: piece.text }],
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
