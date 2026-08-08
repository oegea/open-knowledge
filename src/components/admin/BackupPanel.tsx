'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '../ui/Button';
import styles from './BackupPanel.module.css';

export function BackupPanel() {
  const { t } = useI18n();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoring, setRestoring] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRestore = async (file: File | undefined) => {
    if (!file) return;
    // Destructive action: the admin must confirm the full replacement.
    if (!window.confirm(t('admin.restoreWarning'))) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setRestoring(true);
    setErrorMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/backup', { method: 'POST', body: formData });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? t('common.error'));
      window.alert(t('admin.restoreDone'));
      router.push('/login');
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setRestoring(false);
    }
  };

  return (
    <section className={styles.panel}>
      <h2 className={styles.title}>{t('admin.backup')}</h2>
      <p className={styles.hint}>{t('admin.backupHint')}</p>

      <div className={styles.actions}>
        <a href="/api/backup" className={styles.downloadButton} download>
          ↓ {t('admin.downloadBackup')}
        </a>

        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,application/zip"
          className={styles.fileInput}
          onChange={(event) => handleRestore(event.target.files?.[0])}
        />
        <Button
          type="button"
          variant="danger"
          size="sm"
          disabled={restoring}
          onClick={() => fileInputRef.current?.click()}
        >
          {restoring ? t('common.loading') : t('admin.restoreBackup')}
        </Button>
      </div>

      <p className={styles.warning}>⚠ {t('admin.restoreHint')}</p>

      {errorMessage ? (
        <p role="alert" className={styles.error}>
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}
