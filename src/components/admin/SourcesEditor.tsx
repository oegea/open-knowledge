'use client';

import { SourcePrimitive } from '@/modules/course/domain/Source';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '../ui/Button';
import styles from './SourcesEditor.module.css';

interface SourcesEditorProps {
  sources: SourcePrimitive[];
  onChange: (sources: SourcePrimitive[]) => void;
}

/** Bibliography editor: each entry is a reference title with an optional link. */
export function SourcesEditor({ sources, onChange }: SourcesEditorProps) {
  const { t } = useI18n();

  const update = (index: number, patch: Partial<SourcePrimitive>) => {
    onChange(sources.map((source, i) => (i === index ? { ...source, ...patch } : source)));
  };

  return (
    <div className={styles.editor}>
      <span className={styles.label}>{t('admin.sources')}</span>

      {sources.map((source, index) => (
        <div key={index} className={styles.row}>
          <input
            className={styles.titleInput}
            placeholder={t('admin.sourceTitlePlaceholder')}
            aria-label={`${t('admin.sources')} ${index + 1}`}
            value={source.title}
            maxLength={300}
            onChange={(event) => update(index, { title: event.target.value })}
          />
          <input
            className={styles.urlInput}
            type="url"
            placeholder="https://…"
            aria-label={`URL ${index + 1}`}
            value={source.url ?? ''}
            onChange={(event) => update(index, { url: event.target.value || null })}
          />
          <Button
            type="button"
            variant="danger"
            size="sm"
            aria-label={t('common.delete')}
            onClick={() => onChange(sources.filter((_, i) => i !== index))}
          >
            ×
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onChange([...sources, { title: '', url: null }])}
      >
        + {t('admin.addSource')}
      </Button>
    </div>
  );
}
