'use client';

import { FormEvent, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '../ui/Button';
import { TextField } from '../ui/Field';
import styles from './DisplayNameForm.module.css';

interface DisplayNameFormProps {
  initial: string;
}

export function DisplayNameForm({ initial }: DisplayNameFormProps) {
  const { t } = useI18n();
  const [displayName, setDisplayName] = useState(initial);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('saving');
    setErrorMessage(null);
    try {
      const response = await fetch('/api/identity/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName }),
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
        label={t('account.displayName')}
        hint={t('account.displayNameHint')}
        value={displayName}
        onChange={(event) => setDisplayName(event.target.value)}
        maxLength={100}
      />

      {errorMessage ? (
        <p role="alert" className={styles.error}>
          {errorMessage}
        </p>
      ) : null}

      <div className={styles.actions}>
        <Button type="submit" size="sm" disabled={status === 'saving'}>
          {status === 'saving' ? t('common.saving') : t('common.save')}
        </Button>
        {status === 'saved' ? <span className={styles.saved}>{t('common.saved')}</span> : null}
      </div>
    </form>
  );
}
