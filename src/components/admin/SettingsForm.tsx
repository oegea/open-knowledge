'use client';

import { FormEvent, useRef, useState } from 'react';
import { InstanceSettingsPrimitive } from '@/modules/settings/domain/InstanceSettings';
import { HttpCourseAdminRepository } from '@/modules/course/infrastructure/HttpCourseAdminRepository';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '../ui/Button';
import { CheckboxField, TextField } from '../ui/Field';
import styles from './SettingsForm.module.css';

interface SettingsFormProps {
  initial: InstanceSettingsPrimitive;
}

export function SettingsForm({ initial }: SettingsFormProps) {
  const { t } = useI18n();
  const [settings, setSettings] = useState<InstanceSettingsPrimitive>(initial);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setErrorMessage(null);
    try {
      const repository = new HttpCourseAdminRepository();
      const path = await repository.uploadMedia('images', file);
      setSettings((current) => ({ ...current, logoPath: path }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('saving');
    setErrorMessage(null);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? t('common.error'));
      setStatus('saved');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : t('common.error'));
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <TextField
        label={t('admin.libraryName')}
        value={settings.libraryName}
        onChange={(event) => setSettings({ ...settings, libraryName: event.target.value })}
        required
        maxLength={100}
      />

      <div className={styles.logoBlock}>
        <span className={styles.logoLabel}>{t('admin.logo')}</span>
        <p className={styles.logoHint}>{t('admin.logoHint')}</p>
        {settings.logoPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.logoPath} alt="" className={styles.logoPreview} />
        ) : null}
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          className={styles.fileInput}
          onChange={(event) => handleLogoChange(event.target.files?.[0])}
        />
        <div className={styles.logoActions}>
          <Button
            type="button"
            variant="soft"
            size="sm"
            disabled={uploading}
            onClick={() => logoInputRef.current?.click()}
          >
            {uploading ? t('admin.uploading') : t('admin.upload')}
          </Button>
          {settings.logoPath ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setSettings({ ...settings, logoPath: null })}
            >
              {t('common.delete')}
            </Button>
          ) : null}
        </div>
      </div>

      <TextField
        label={t('admin.heroTitle')}
        hint={t('admin.heroHint')}
        value={settings.heroTitle}
        onChange={(event) => setSettings({ ...settings, heroTitle: event.target.value })}
        maxLength={120}
      />

      <TextField
        label={t('admin.heroText')}
        hint={t('admin.heroHint')}
        value={settings.heroText}
        onChange={(event) => setSettings({ ...settings, heroText: event.target.value })}
        maxLength={200}
      />

      <TextField
        label={t('admin.ownerName')}
        hint={t('admin.ownerNameHint')}
        value={settings.ownerName}
        onChange={(event) => setSettings({ ...settings, ownerName: event.target.value })}
        maxLength={100}
      />

      <CheckboxField
        label={t('admin.registrationOpen')}
        hint={t('admin.registrationOpenHint')}
        checked={settings.registrationOpen}
        onChange={(event) => setSettings({ ...settings, registrationOpen: event.target.checked })}
      />

      <CheckboxField
        label={t('admin.newsEnabled')}
        hint={t('admin.newsEnabledHint')}
        checked={settings.newsEnabled}
        onChange={(event) => setSettings({ ...settings, newsEnabled: event.target.checked })}
      />

      {errorMessage ? (
        <p role="alert" className={styles.error}>
          {errorMessage}
        </p>
      ) : null}

      <div className={styles.actions}>
        <Button type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? t('common.saving') : t('common.save')}
        </Button>
        {status === 'saved' ? <span className={styles.saved}>{t('common.saved')}</span> : null}
      </div>
    </form>
  );
}
