'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '../ui/Button';
import styles from './authForms.module.css';

interface RecoveryChallenge {
  secret: string;
  qrDataUrl: string;
}

export function RecoverForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [challenge, setChallenge] = useState<RecoveryChallenge | null>(null);
  const [code, setCode] = useState('');
  const [newRecoveryCode, setNewRecoveryCode] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/identity/recovery/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), recoveryCode: recoveryCode.trim() }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? t('common.error'));
      setChallenge(body);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async (event: FormEvent) => {
    event.preventDefault();
    if (!challenge) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/identity/recovery/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          recoveryCode: recoveryCode.trim(),
          secret: challenge.secret,
          code,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? t('common.error'));
      setNewRecoveryCode(body.recoveryCode);
      setIsAdmin(body.user.isAdmin);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (newRecoveryCode) {
    return (
      <div className={`ok-glass ${styles.panel}`}>
        <h1 className={styles.title}>{t('auth.recoveryCodeTitle')}</h1>
        <p className={styles.hint}>{t('auth.recoveryCodeHint')}</p>
        <code className={styles.recoveryCode}>{newRecoveryCode}</code>
        <Button onClick={() => router.push(isAdmin ? '/admin' : '/')}>
          {t('auth.recoveryCodeSaved')}
        </Button>
      </div>
    );
  }

  if (challenge) {
    return (
      <form className={`ok-glass ${styles.panel}`} onSubmit={handleConfirm}>
        <h1 className={styles.title}>{t('auth.recoveryTitle')}</h1>

        <div className={styles.block}>
          <span className={styles.fieldLabel}>{t('auth.scanQr')}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={challenge.qrDataUrl} alt="" className={styles.qr} />
        </div>

        <label className={styles.block}>
          <span className={styles.fieldLabel}>{t('auth.enterCode')}</span>
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

        <Button type="submit" disabled={submitting || code.length !== 6}>
          {submitting ? t('common.loading') : t('common.continue')}
        </Button>
      </form>
    );
  }

  return (
    <form className={`ok-glass ${styles.panel}`} onSubmit={handleInit}>
      <h1 className={styles.title}>{t('auth.recoveryTitle')}</h1>

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
        <span className={styles.fieldLabel}>{t('auth.recoveryCodeLabel')}</span>
        <input
          className={styles.codeInput}
          style={{ letterSpacing: 'normal', fontSize: 'var(--ok-text-md)' }}
          value={recoveryCode}
          onChange={(event) => setRecoveryCode(event.target.value)}
          required
        />
      </label>

      {errorMessage ? (
        <p role="alert" className={styles.error}>
          {errorMessage}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={submitting || identifier.trim() === '' || recoveryCode.trim() === ''}
      >
        {submitting ? t('common.loading') : t('common.continue')}
      </Button>

      <Link href="/login" className={styles.secondaryLink}>
        {t('common.back')}
      </Link>
    </form>
  );
}
