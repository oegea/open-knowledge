'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '../ui/Button';
import styles from './authForms.module.css';

interface Challenge {
  identifier: string;
  secret: string;
  qrDataUrl: string;
  willBeAdmin: boolean;
}

export function RegisterForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [closed, setClosed] = useState(false);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadChallenge = useCallback(async () => {
    setErrorMessage(null);
    const response = await fetch('/api/identity/challenge', { method: 'POST' });
    if (response.status === 403) {
      setClosed(true);
      return;
    }
    const body = await response.json();
    if (response.ok) {
      setChallenge(body);
    } else {
      setErrorMessage(body.error ?? t('common.error'));
    }
  }, [t]);

  useEffect(() => {
    loadChallenge();
  }, [loadChallenge]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!challenge) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/identity/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: challenge.identifier,
          secret: challenge.secret,
          code,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? t('common.error'));
      setRecoveryCode(body.recoveryCode);
      setIsAdmin(body.user.isAdmin);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (closed) {
    return (
      <div className={`ok-glass ${styles.panel}`}>
        <h1 className={styles.title}>{t('auth.register')}</h1>
        <p className={styles.hint}>{t('auth.registrationClosed')}</p>
        <Link href="/" className={styles.secondaryLink}>
          {t('common.back')}
        </Link>
      </div>
    );
  }

  if (recoveryCode) {
    return (
      <div className={`ok-glass ${styles.panel}`}>
        <h1 className={styles.title}>{t('auth.recoveryCodeTitle')}</h1>
        <p className={styles.hint}>{t('auth.recoveryCodeHint')}</p>
        <code className={styles.recoveryCode}>{recoveryCode}</code>
        <Button onClick={() => router.push(isAdmin ? '/admin' : '/')}>
          {t('auth.recoveryCodeSaved')}
        </Button>
      </div>
    );
  }

  return (
    <form className={`ok-glass ${styles.panel}`} onSubmit={handleSubmit}>
      <h1 className={styles.title}>{t('auth.register')}</h1>
      <p className={styles.hint}>{t('auth.noPersonalData')}</p>

      {challenge?.willBeAdmin ? (
        <p className={styles.adminNote}>{t('auth.firstUserAdmin')}</p>
      ) : null}

      <div className={styles.block}>
        <span className={styles.fieldLabel}>{t('auth.yourIdentifier')}</span>
        <div className={styles.identifierRow}>
          <span className={styles.identifier}>{challenge?.identifier ?? '…'}</span>
          <button
            type="button"
            className={styles.refreshButton}
            aria-label={t('auth.refreshIdentifier')}
            onClick={loadChallenge}
          >
            ⟳
          </button>
        </div>
      </div>

      <div className={styles.block}>
        <span className={styles.fieldLabel}>{t('auth.scanQr')}</span>
        {challenge ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={challenge.qrDataUrl} alt="" className={styles.qr} />
        ) : (
          <span className={styles.qrPlaceholder} />
        )}
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

      <Button type="submit" disabled={submitting || !challenge || code.length !== 6}>
        {submitting ? t('common.loading') : t('auth.register')}
      </Button>

      <Link href="/login" className={styles.secondaryLink}>
        {t('auth.haveAccount')} {t('auth.signIn')}
      </Link>
    </form>
  );
}
