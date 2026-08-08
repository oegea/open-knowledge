'use client';

import { FormEvent, useState } from 'react';
import { InstanceSettingsPrimitive } from '@/modules/settings/domain/InstanceSettings';
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
