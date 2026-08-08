'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NewsPostPrimitive } from '@/modules/news/domain/NewsPost';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '../ui/Button';
import { CheckboxField, TextAreaField, TextField } from '../ui/Field';
import styles from './NewsEditor.module.css';

interface NewsEditorProps {
  initial?: NewsPostPrimitive;
}

export function NewsEditor({ initial }: NewsEditorProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [markdown, setMarkdown] = useState(initial?.markdown ?? '');
  const [published, setPublished] = useState(initial?.published ?? false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    try {
      const response = await fetch(initial?.id ? `/api/news/${initial.id}` : '/api/news', {
        method: initial?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, markdown, published }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? t('common.error'));
      router.push('/admin/news');
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <TextField
        label={t('admin.postTitle')}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
        maxLength={200}
      />

      <TextAreaField
        label={t('admin.content')}
        value={markdown}
        onChange={(event) => setMarkdown(event.target.value)}
        rows={12}
        required
        className={styles.markdownArea}
      />

      <CheckboxField
        label={t('admin.published')}
        checked={published}
        onChange={(event) => setPublished(event.target.checked)}
      />

      {errorMessage ? (
        <p role="alert" className={styles.error}>
          {errorMessage}
        </p>
      ) : null}

      <div className={styles.actions}>
        <Button type="submit" disabled={saving}>
          {saving ? t('common.saving') : t('common.save')}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/news')}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
}
