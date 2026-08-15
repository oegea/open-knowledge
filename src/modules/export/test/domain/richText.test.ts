import { marked, type Tokens } from 'marked';
import { inlineSegments, inlinePlainText } from '../../domain/richText';

function paragraphTokens(markdown: string) {
  const paragraph = marked.lexer(markdown)[0] as Tokens.Paragraph;
  return paragraph.tokens;
}

describe('richText (unit)', () => {
  it('splits bold and italic runs into styled segments without markers', () => {
    const segments = inlineSegments(paragraphTokens('Hola **mundo** y *cursiva* fin'));

    expect(segments).toEqual([
      expect.objectContaining({ text: 'Hola ', bold: false, italic: false }),
      expect.objectContaining({ text: 'mundo', bold: true, italic: false }),
      expect.objectContaining({ text: ' y ', bold: false }),
      expect.objectContaining({ text: 'cursiva', italic: true, bold: false }),
      expect.objectContaining({ text: ' fin', bold: false, italic: false }),
    ]);
    expect(segments.map((segment) => segment.text).join('')).not.toContain('*');
  });

  it('combines nested styles (bold inside italic)', () => {
    const segments = inlineSegments(paragraphTokens('***ambos***'));
    expect(segments).toEqual([expect.objectContaining({ text: 'ambos', bold: true, italic: true })]);
  });

  it('resolves bold inside list items through the wrapping text token', () => {
    const list = marked.lexer('- Item con **negrita** en lista')[0] as Tokens.List;
    const segments = inlineSegments(list.items[0].tokens);

    expect(segments.map((segment) => segment.text).join('')).toBe('Item con negrita en lista');
    expect(segments.find((segment) => segment.text === 'negrita')?.bold).toBe(true);
  });

  it('resolves bold inside blockquotes through the wrapping paragraph token', () => {
    const quote = marked.lexer('> Cita con **negrita**')[0] as Tokens.Blockquote;
    const segments = inlineSegments(quote.tokens);

    expect(segments.map((segment) => segment.text).join('')).toBe('Cita con negrita');
    expect(segments.find((segment) => segment.text === 'negrita')?.bold).toBe(true);
  });

  it('keeps link targets on their segments', () => {
    const segments = inlineSegments(paragraphTokens('Mira [la web](https://example.org) hoy'));
    expect(segments).toEqual([
      expect.objectContaining({ text: 'Mira ', link: null }),
      expect.objectContaining({ text: 'la web', link: 'https://example.org' }),
      expect.objectContaining({ text: ' hoy', link: null }),
    ]);
  });

  it('marks inline code and strikethrough', () => {
    const segments = inlineSegments(paragraphTokens('Usa `pnpm test` y ~~esto no~~'));
    expect(segments.find((segment) => segment.code)?.text).toBe('pnpm test');
    expect(segments.find((segment) => segment.strike)?.text).toBe('esto no');
  });

  it('unescapes backslash escapes', () => {
    const segments = inlineSegments(paragraphTokens('Literal: \\*no es cursiva\\*'));
    expect(segments.map((segment) => segment.text).join('')).toBe('Literal: *no es cursiva*');
  });

  it('applies a base style to every segment', () => {
    const segments = inlineSegments(paragraphTokens('texto **fuerte**'), { italic: true });
    expect(segments.every((segment) => segment.italic)).toBe(true);
    expect(segments[1]).toEqual(expect.objectContaining({ text: 'fuerte', bold: true }));
  });

  it('merges adjacent segments with the same style', () => {
    // The escape token splits the run; both halves are plain text again.
    const segments = inlineSegments(paragraphTokens('a \\* b'));
    expect(segments).toHaveLength(1);
    expect(segments[0].text).toBe('a * b');
  });

  it('projects plain text with a fallback', () => {
    expect(inlinePlainText(paragraphTokens('**hola**'))).toBe('hola');
    expect(inlinePlainText(undefined, 'fallback')).toBe('fallback');
    expect(inlinePlainText([], 'fallback')).toBe('fallback');
  });
});
