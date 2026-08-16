'use client';

import { FormEvent, useRef, useState } from 'react';
import { MATERIAL_TYPES, MaterialInput, MaterialPrimitive, MaterialType } from '@/modules/course/domain/Material';
import { ExamPrimitive } from '@/modules/course/domain/Exam';
import { SourcePrimitive } from '@/modules/course/domain/Source';
import { HttpCourseAdminRepository } from '@/modules/course/infrastructure/HttpCourseAdminRepository';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '../ui/Button';
import { CheckboxField, SelectField, TextAreaField, TextField } from '../ui/Field';
import { ExamEditor } from './ExamEditor';
import { SourcesEditor } from './SourcesEditor';
import styles from './MaterialForm.module.css';

interface MaterialFormProps {
  initial?: MaterialPrimitive;
  onSubmit: (material: MaterialInput) => Promise<void>;
  onCancel: () => void;
}

const EMPTY_EXAM: ExamPrimitive = { questions: [], passingScore: 0.7 };

export function MaterialForm({ initial, onSubmit, onCancel }: MaterialFormProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [type, setType] = useState<MaterialType>(initial?.type ?? 'markdown');
  const [markdown, setMarkdown] = useState(initial?.markdown ?? '');
  const [mediaPath, setMediaPath] = useState<string | null>(initial?.mediaPath ?? null);
  const [transcriptPath, setTranscriptPath] = useState<string | null>(
    initial?.transcriptPath ?? null
  );
  const [exam, setExam] = useState<ExamPrimitive>(initial?.exam ?? EMPTY_EXAM);
  const [required, setRequired] = useState(initial?.required ?? true);
  const [sources, setSources] = useState<SourcePrimitive[]>(initial?.sources ?? []);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingTranscript, setUploadingTranscript] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const transcriptInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setErrorMessage(null);
    try {
      const repository = new HttpCourseAdminRepository();
      const path = await repository.uploadMedia(type === 'audio' ? 'audio' : 'video', file);
      setMediaPath(path);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setUploading(false);
    }
  };

  const handleTranscriptUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploadingTranscript(true);
    setErrorMessage(null);
    try {
      const repository = new HttpCourseAdminRepository();
      setTranscriptPath(await repository.uploadMedia('transcripts', file));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setUploadingTranscript(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    try {
      await onSubmit({
        title,
        type,
        markdown,
        mediaPath,
        exam: type === 'exam' ? exam : null,
        required,
        sources: sources.filter((source) => source.title.trim() !== ''),
        transcriptPath: type === 'audio' || type === 'video' ? transcriptPath : null,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.row}>
        <TextField
          label={t('admin.materialTitle')}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          maxLength={200}
        />

        <SelectField
          label={t('admin.materialType')}
          value={type}
          onChange={(event) => setType(event.target.value as MaterialType)}
        >
          {MATERIAL_TYPES.map((materialType) => (
            <option key={materialType} value={materialType}>
              {t(`material.type.${materialType}`)}
            </option>
          ))}
        </SelectField>
      </div>

      {type === 'audio' || type === 'video' ? (
        <div className={styles.mediaBlock}>
          <span className={styles.mediaLabel}>{t('admin.mediaFile')}</span>
          {mediaPath ? (
            type === 'audio' ? (
              <audio controls src={mediaPath} className={styles.mediaPreview} />
            ) : (
              <video controls src={mediaPath} className={styles.mediaPreview} />
            )
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept={type === 'audio' ? 'audio/*' : 'video/*'}
            className={styles.fileInput}
            onChange={(event) => handleUpload(event.target.files?.[0])}
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
      ) : null}

      {type === 'audio' || type === 'video' ? (
        <div className={styles.mediaBlock}>
          <span className={styles.mediaLabel}>{t('admin.transcriptFile')}</span>
          <p className={styles.hint}>{t('admin.transcriptHint')}</p>
          {transcriptPath ? (
            <p className={styles.attached}>
              <a href={transcriptPath} target="_blank" rel="noopener noreferrer">
                {t('admin.transcriptAttached')}
              </a>
            </p>
          ) : null}
          <input
            ref={transcriptInputRef}
            type="file"
            accept="application/json,.json"
            className={styles.fileInput}
            aria-label={t('admin.transcriptFile')}
            onChange={(event) => handleTranscriptUpload(event.target.files?.[0])}
          />
          <div className={styles.inlineActions}>
            <Button
              type="button"
              variant="soft"
              size="sm"
              disabled={uploadingTranscript}
              onClick={() => transcriptInputRef.current?.click()}
            >
              {uploadingTranscript ? t('admin.uploading') : t('admin.upload')}
            </Button>
            {transcriptPath ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setTranscriptPath(null)}>
                {t('admin.transcriptRemove')}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {type === 'exam' ? (
        <ExamEditor exam={exam} onChange={setExam} />
      ) : (
        <TextAreaField
          label={type === 'markdown' ? t('admin.content') : t('admin.notes')}
          value={markdown}
          onChange={(event) => setMarkdown(event.target.value)}
          rows={type === 'markdown' ? 12 : 4}
          className={styles.markdownArea}
        />
      )}

      <SourcesEditor sources={sources} onChange={setSources} />

      <CheckboxField
        label={t('admin.required')}
        checked={required}
        onChange={(event) => setRequired(event.target.checked)}
      />

      {errorMessage ? (
        <p role="alert" className={styles.error}>
          {errorMessage}
        </p>
      ) : null}

      <div className={styles.actions}>
        <Button type="submit" disabled={saving || uploading || uploadingTranscript}>
          {saving ? t('common.saving') : t('common.save')}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
}
