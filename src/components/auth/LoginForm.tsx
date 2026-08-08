'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '../ui/Button';
import styles from './authForms.module.css';

export function LoginForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/identity/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), code }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? t('common.error'));
      router.push(body.user.isAdmin ? '/admin' : '/');
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={`ok-glass ${styles.panel}`} onSubmit={handleSubmit}>
      <h1 className={styles.title}>{t('auth.signIn')}</h1>

      <label className={styles.block}>
        <span className={styles.fieldLabel}>{t('auth.identifierLabel')}</span>
        <input
          className={styles.codeInput}
          style={{ letterSpacing: 'normal', fontSize: 'var(--ok-text-lg)' }}
          placeholder="Erudito#4821"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          required
        />
      </label>

      <label className={styles.block}>
        <span className={styles.fieldLabel}>{t('auth.codeLabel')}</span>
        <input
          className={styles.codeInput}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
          required
        />
      </label>

      {errorMessage ? (
        <p role="alert" className={styles.error}>
          {errorMessage}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting || code.length !== 6 || identifier.trim() === ''}>
        {submitting ? t('common.loading') : t('auth.signIn')}
      </Button>

      <Link href="/register" className={styles.secondaryLink}>
        {t('auth.noAccount')} {t('auth.register')}
      </Link>
      <Link href="/recover" className={styles.secondaryLink}>
        {t('auth.lostAccess')}
      </Link>
    </form>
  );
}
