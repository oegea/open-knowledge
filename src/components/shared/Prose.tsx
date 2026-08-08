import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './Prose.module.css';

/** Long-form markdown rendering with the reading typography of the brand. */
export function Prose({ content }: { content: string }) {
  return (
    <div className={styles.prose}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
