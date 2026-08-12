'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { CourseDetailsInput } from '@/modules/course/domain/Course';
import { HttpCourseAdminRepository } from '@/modules/course/infrastructure/HttpCourseAdminRepository';
import { LOCALES } from '@/i18n/config';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '../ui/Button';
import { CheckboxField, SelectField, TextAreaField, TextField } from '../ui/Field';
import { SourcesEditor } from './SourcesEditor';
import styles from './CourseDetailsForm.module.css';

interface CourseDetailsFormProps {
  initial?: CourseDetailsInput;
  submitLabel: string;
  onSubmit: (details: CourseDetailsInput) => Promise<void>;
}

const EMPTY_DETAILS: CourseDetailsInput = {
  title: '',
  description: '',
  language: 'en',
  category: null,
  coverImage: null,
  authors: [],
  sources: [],
  license: null,
  aiAssisted: false,
};

export function CourseDetailsForm({ initial, submitLabel, onSubmit }: CourseDetailsFormProps) {
  const { t } = useI18n();
  const [details, setDetails] = useState<CourseDetailsInput>(initial ?? EMPTY_DETAILS);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Managed category names feed the datalist as suggestions only; the field
  // stays free text, so a failed fetch simply means no suggestions.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) return;
        const body = await response.json();
        if (cancelled || !Array.isArray(body.categories)) return;
        setCategoryOptions(
          body.categories
            .map((category: { name?: string }) => category.name)
            .filter((name: unknown): name is string => typeof name === 'string')
        );
      } catch {
        // Suggestions are progressive enhancement — ignore failures.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('saving');
    setErrorMessage(null);
    try {
      await onSubmit({
        ...details,
        sources: details.sources.filter((source) => source.title.trim() !== ''),
      });
      setStatus('saved');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : t('common.error'));
    }
  };

  const handleCoverChange = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setErrorMessage(null);
    try {
      const repository = new HttpCourseAdminRepository();
      const path = await repository.uploadMedia('covers', file);
      setDetails((current) => ({ ...current, coverImage: path }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <TextField
        label={t('admin.courseTitle')}
        value={details.title}
        onChange={(event) => setDetails({ ...details, title: event.target.value })}
        required
        maxLength={200}
      />

      <TextAreaField
        label={t('admin.courseDescription')}
        value={details.description}
        onChange={(event) => setDetails({ ...details, description: event.target.value })}
        required
        maxLength={5000}
      />

      <div className={styles.row}>
        <SelectField
          label={t('admin.courseLanguage')}
          value={details.language}
          onChange={(event) => setDetails({ ...details, language: event.target.value })}
        >
          {LOCALES.map((localeInfo) => (
            <option key={localeInfo.code} value={localeInfo.code}>
              {localeInfo.iso} · {localeInfo.nativeName}
            </option>
          ))}
        </SelectField>

        <div>
          <TextField
            label={t('admin.category')}
            hint={t('admin.categoryPickHint')}
            list="ok-category-suggestions"
            value={details.category ?? ''}
            onChange={(event) =>
              setDetails({ ...details, category: event.target.value || null })
            }
            maxLength={100}
          />
          <datalist id="ok-category-suggestions">
            {categoryOptions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
      </div>

      <div className={styles.coverBlock}>
        <span className={styles.coverLabel}>{t('admin.cover')}</span>
        {details.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={details.coverImage} alt="" className={styles.coverPreview} />
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className={styles.fileInput}
          onChange={(event) => handleCoverChange(event.target.files?.[0])}
        />
        <Button
          type="button"
          variant="soft"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? t('admin.uploading') : t('admin.upload')}
        </Button>
      </div>

      <div className={styles.row}>
        <TextAreaField
          label={t('admin.authors')}
          hint={t('admin.authorsPlaceholder')}
          value={details.authors.join('\n')}
          onChange={(event) =>
            setDetails({
              ...details,
              authors: event.target.value.split('\n').filter((line) => line.trim() !== ''),
            })
          }
        />

        <SourcesEditor
          sources={details.sources}
          onChange={(sources) => setDetails({ ...details, sources })}
        />
      </div>

      <div className={styles.row}>
        <div>
          <TextField
            label={t('admin.license')}
            hint={t('admin.licenseHint')}
            list="ok-license-suggestions"
            value={details.license ?? ''}
            onChange={(event) => setDetails({ ...details, license: event.target.value || null })}
            maxLength={100}
          />
          <datalist id="ok-license-suggestions">
            <option value="CC BY 4.0" />
            <option value="CC BY-SA 4.0" />
            <option value="CC BY-NC 4.0" />
            <option value="CC BY-NC-SA 4.0" />
            <option value="CC0 1.0" />
            <option value="Public Domain" />
            <option value="MIT" />
          </datalist>
        </div>
      </div>

      <CheckboxField
        label={t('admin.aiAssisted')}
        hint={t('admin.aiAssistedHint')}
        checked={details.aiAssisted}
        onChange={(event) => setDetails({ ...details, aiAssisted: event.target.checked })}
      />

      {errorMessage ? (
        <p role="alert" className={styles.error}>
          {errorMessage}
        </p>
      ) : null}

      <div className={styles.actions}>
        <Button type="submit" disabled={status === 'saving' || uploading}>
          {status === 'saving' ? t('common.saving') : submitLabel}
        </Button>
        {status === 'saved' ? <span className={styles.savedNote}>{t('common.saved')}</span> : null}
      </div>
    </form>
  );
}
