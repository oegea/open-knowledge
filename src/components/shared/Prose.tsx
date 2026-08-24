import type { MouseEventHandler, Ref } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { rehypeWordSpans } from './rehypeWordSpans';
import styles from './Prose.module.css';

interface ProseProps {
  content: string;
  /**
   * Wraps every word in a numbered `<span data-word>` so a narration can be
   * highlighted word by word (see NarratedProse). Off by default: plain
   * reading keeps the DOM lean.
   */
  annotateWords?: boolean;
  /**
   * Bionic reading (ADR 0019): bold the fixation prefix of every word.
   * Requires `annotateWords`.
   */
  bionic?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
  ref?: Ref<HTMLDivElement>;
}

/** Long-form markdown rendering with the reading typography of the brand. */
export function Prose({ content, annotateWords = false, bionic = false, onClick, ref }: ProseProps) {
  return (
    <div ref={ref} className={styles.prose} onClick={onClick}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={annotateWords ? [[rehypeWordSpans, { bionic }]] : undefined}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
