import {
  bionicPrefixLength,
  rehypeWordSpans,
  splitWords,
} from '../../src/components/shared/rehypeWordSpans';

describe('rehypeWordSpans', () => {
  it('splits text into alternating word and whitespace pieces', () => {
    expect(splitWords('  El agua\nempezó ')).toEqual([
      { text: '  ', word: false },
      { text: 'El', word: true },
      { text: ' ', word: false },
      { text: 'agua', word: true },
      { text: '\n', word: false },
      { text: 'empezó', word: true },
      { text: ' ', word: false },
    ]);
  });

  it('wraps every word in a numbered span, in document order, across nested elements', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'p',
          children: [
            { type: 'text', value: 'El ' },
            { type: 'element', tagName: 'strong', children: [{ type: 'text', value: 'agua fría' }] },
            { type: 'text', value: ' empezó.' },
          ],
        },
      ],
    };

    rehypeWordSpans()(tree);

    const paragraph = tree.children[0] as { children: { type: string; tagName?: string; properties?: Record<string, string>; children?: unknown[] }[] };
    const words = (nodes: typeof paragraph.children): string[] =>
      nodes.flatMap((node) =>
        node.tagName === 'span'
          ? [`${node.properties!.dataWord}:${(node.children![0] as { value: string }).value}`]
          : node.children
            ? words(node.children as typeof paragraph.children)
            : []
      );
    expect(words(paragraph.children)).toEqual(['0:El', '1:agua', '2:fría', '3:empezó.']);
    // Whitespace survives between the spans so the text reads unchanged.
    expect(paragraph.children[1]).toEqual({ type: 'text', value: ' ' });
  });

  describe('bionic reading (ADR 0019)', () => {
    it('bolds ~40% of the word, at least one letter, ignoring punctuation', () => {
      expect(bionicPrefixLength('y')).toBe(1);
      expect(bionicPrefixLength('sol')).toBe(2);
      expect(bionicPrefixLength('planeta')).toBe(3);
      expect(bionicPrefixLength('certificaciones')).toBe(6);
      expect(bionicPrefixLength('«todos».')).toBe(2);
      expect(bionicPrefixLength('—')).toBe(0);
    });

    it('splits each word span around a bold fixation prefix', () => {
      const tree = {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'p',
            children: [{ type: 'text', value: '«planeta» y' }],
          },
        ],
      };

      rehypeWordSpans({ bionic: true })(tree);

      const paragraph = tree.children[0] as { children: unknown[] };
      expect(paragraph.children[0]).toEqual({
        type: 'element',
        tagName: 'span',
        properties: { dataWord: '0' },
        children: [
          { type: 'text', value: '«' },
          {
            type: 'element',
            tagName: 'b',
            properties: {},
            children: [{ type: 'text', value: 'pla' }],
          },
          { type: 'text', value: 'neta»' },
        ],
      });
      // A fully-bold short word gets no trailing text node.
      expect(paragraph.children[2]).toEqual({
        type: 'element',
        tagName: 'span',
        properties: { dataWord: '1' },
        children: [
          {
            type: 'element',
            tagName: 'b',
            properties: {},
            children: [{ type: 'text', value: 'y' }],
          },
        ],
      });
    });

    it('leaves the span text unchanged when bionic is off', () => {
      const tree = {
        type: 'root',
        children: [
          { type: 'element', tagName: 'p', children: [{ type: 'text', value: 'planeta' }] },
        ],
      };

      rehypeWordSpans()(tree);

      expect((tree.children[0] as { children: unknown[] }).children[0]).toEqual({
        type: 'element',
        tagName: 'span',
        properties: { dataWord: '0' },
        children: [{ type: 'text', value: 'planeta' }],
      });
    });
  });
});
