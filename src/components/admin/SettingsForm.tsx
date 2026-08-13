'use client';

import { FormEvent, useState } from 'react';
import { InstanceSettingsPrimitive } from '@/modules/settings/domain/InstanceSettings';
import { HttpCourseAdminRepository } from '@/modules/course/infrastructure/HttpCourseAdminRepository';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '../ui/Button';
import { CheckboxField, TextField } from '../ui/Field';
import { LogoField } from './LogoField';
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

  const uploadLogo = async (
    file: File | undefined,
    field: 'logoPath' | 'logoDarkPath' | 'certificateLogoPath' | 'documentLogoPath' | 'heroImagePath'
  ) => {
    if (!file) return;
    setUploading(true);
    setErrorMessage(null);
    try {
      const repository = new HttpCourseAdminRepository();
      const path = await repository.uploadMedia('images', file);
      setSettings((current) => ({ ...current, [field]: path }));
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

      <LogoField
        label={t('admin.logoHeader')}
        hint={t('admin.logoHint')}
        value={settings.logoPath}
        uploading={uploading}
        uploadLabel={t('admin.upload')}
        uploadingLabel={t('admin.uploading')}
        deleteLabel={t('common.delete')}
        onUpload={(file) => uploadLogo(file, 'logoPath')}
        onClear={() => setSettings({ ...settings, logoPath: null })}
      />

      <LogoField
        label={t('admin.logoDark')}
        hint={t('admin.logoDarkHint')}
        value={settings.logoDarkPath}
        uploading={uploading}
        uploadLabel={t('admin.upload')}
        uploadingLabel={t('admin.uploading')}
        deleteLabel={t('common.delete')}
        onUpload={(file) => uploadLogo(file, 'logoDarkPath')}
        onClear={() => setSettings({ ...settings, logoDarkPath: null })}
      />

      <CheckboxField
        label={t('admin.invertLogo')}
        hint={t('admin.invertLogoHint')}
        checked={settings.invertLogoInDarkMode}
        onChange={(event) =>
          setSettings({ ...settings, invertLogoInDarkMode: event.target.checked })
        }
      />

      <LogoField
        label={t('admin.logoCertificates')}
        hint={t('admin.logoFallbackHint')}
        value={settings.certificateLogoPath}
        uploading={uploading}
        uploadLabel={t('admin.upload')}
        uploadingLabel={t('admin.uploading')}
        deleteLabel={t('common.delete')}
        onUpload={(file) => uploadLogo(file, 'certificateLogoPath')}
        onClear={() => setSettings({ ...settings, certificateLogoPath: null })}
      />

      <LogoField
        label={t('admin.logoDocuments')}
        hint={t('admin.logoFallbackHint')}
        value={settings.documentLogoPath}
        uploading={uploading}
        uploadLabel={t('admin.upload')}
        uploadingLabel={t('admin.uploading')}
        deleteLabel={t('common.delete')}
        onUpload={(file) => uploadLogo(file, 'documentLogoPath')}
        onClear={() => setSettings({ ...settings, documentLogoPath: null })}
      />

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

      <LogoField
        label={t('admin.heroImage')}
        hint={t('admin.heroImageHint')}
        value={settings.heroImagePath}
        uploading={uploading}
        uploadLabel={t('admin.upload')}
        uploadingLabel={t('admin.uploading')}
        deleteLabel={t('common.delete')}
        onUpload={(file) => uploadLogo(file, 'heroImagePath')}
        onClear={() => setSettings({ ...settings, heroImagePath: null })}
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
