'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PAGE_PLACEMENTS, PagePlacement, PagePrimitive } from '@/modules/pages/domain/Page';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '../ui/Button';
import { SelectField, TextAreaField, TextField } from '../ui/Field';
import styles from './NewsEditor.module.css';

interface PageEditorProps {
  initial?: PagePrimitive;
}

export function PageEditor({ initial }: PageEditorProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [markdown, setMarkdown] = useState(initial?.markdown ?? '');
  const [placement, setPlacement] = useState<PagePlacement>(initial?.placement ?? 'footer');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    try {
      const response = await fetch(initial?.id ? `/api/pages/${initial.id}` : '/api/pages', {
        method: initial?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, markdown, placement }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? t('common.error'));
      router.push('/admin/pages');
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
        maxLength={100}
      />

      <SelectField
        label={t('admin.placement')}
        hint={t('admin.placementHint')}
        value={placement}
        onChange={(event) => setPlacement(event.target.value as PagePlacement)}
      >
        {PAGE_PLACEMENTS.map((candidate) => (
          <option key={candidate} value={candidate}>
            {t(`placement.${candidate}`)}
          </option>
        ))}
      </SelectField>

      <TextAreaField
        label={t('admin.content')}
        value={markdown}
        onChange={(event) => setMarkdown(event.target.value)}
        rows={14}
        required
        className={styles.markdownArea}
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
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/pages')}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
}
