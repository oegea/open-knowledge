'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MaterialPrimitive } from '@/modules/course/domain/Material';
import { ExamPlayer } from './ExamPlayer';
import styles from './MaterialRenderer.module.css';

interface MaterialRendererProps {
  material: MaterialPrimitive;
  onExamPassed: () => Promise<void> | void;
  onExamFinished?: (answers: Record<string, string>, passed: boolean) => Promise<void> | void;
}

function Markdown({ content }: { content: string }) {
  return (
    <div className={styles.prose}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

export function MaterialRenderer({ material, onExamPassed, onExamFinished }: MaterialRendererProps) {
  switch (material.type) {
    case 'markdown':
      return <Markdown content={material.markdown} />;

    case 'audio':
      return (
        <div className={styles.media}>
          <div className={`ok-glass ${styles.audioCard}`}>
            <audio controls src={material.mediaPath ?? undefined} className={styles.audio} />
          </div>
          {material.markdown ? <Markdown content={material.markdown} /> : null}
        </div>
      );

    case 'video':
      return (
        <div className={styles.media}>
          <video controls src={material.mediaPath ?? undefined} className={styles.video} />
          {material.markdown ? <Markdown content={material.markdown} /> : null}
        </div>
      );

    case 'exam':
      return material.exam ? (
        <ExamPlayer exam={material.exam} onPassed={onExamPassed} onFinished={onExamFinished} />
      ) : null;
  }
}
