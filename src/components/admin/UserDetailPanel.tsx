'use client';

import { FormEvent, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '../ui/Button';
import { TextField } from '../ui/Field';
import styles from './UserDetailPanel.module.css';

interface UserDetails {
  id: string;
  identifier: string;
  displayName: string;
  isAdmin: boolean;
  createdAt: string;
}

interface CertificateItem {
  id: string;
  courseTitle: string;
  holderName: string;
  issuedAt: string;
}

interface UserDetailPanelProps {
  user: UserDetails;
  initialCertificates: CertificateItem[];
}

export function UserDetailPanel({ user, initialCertificates }: UserDetailPanelProps) {
  const { t, locale } = useI18n();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [nameStatus, setNameStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [certificates, setCertificates] = useState(initialCertificates);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(iso));

  const handleNameSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setNameStatus('saving');
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/identity/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? t('common.error'));
      setNameStatus('saved');
      // Issued certificates carry the name: reflect the rename in place.
      setCertificates((current) =>
        current.map((certificate) => ({
          ...certificate,
          holderName: body.user.displayName || user.identifier,
        }))
      );
    } catch (error) {
      setNameStatus('idle');
      setErrorMessage(error instanceof Error ? error.message : t('common.error'));
    }
  };

  const handleRevoke = async (id: string) => {
    setBusyId(id);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/certificates/${id}`, { method: 'DELETE' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? t('common.error'));
      setCertificates((current) => current.filter((certificate) => certificate.id !== id));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setBusyId(null);
      setConfirmingId(null);
    }
  };

  return (
    <div className={styles.panel}>
      <section className={`ok-glass ${styles.card}`}>
        <h2 className={styles.cardTitle}>{t('admin.userProfile')}</h2>
        <dl className={styles.facts}>
          <div className={styles.fact}>
            <dt>{t('auth.identifierLabel')}</dt>
            <dd className={styles.identifier}>{user.identifier}</dd>
          </div>
          <div className={styles.fact}>
            <dt>{t('admin.memberSince')}</dt>
            <dd>{formatDate(user.createdAt)}</dd>
          </div>
          {user.isAdmin ? (
            <div className={styles.fact}>
              <dt>{t('admin.role')}</dt>
              <dd>{t('admin.adminRole')}</dd>
            </div>
          ) : null}
        </dl>

        <form className={styles.nameForm} onSubmit={handleNameSubmit}>
          <TextField
            label={t('account.displayName')}
            hint={t('admin.userDisplayNameHint')}
            value={displayName}
            onChange={(event) => {
              setDisplayName(event.target.value);
              setNameStatus('idle');
            }}
            maxLength={100}
          />
          <div className={styles.nameActions}>
            <Button type="submit" size="sm" disabled={nameStatus === 'saving'}>
              {nameStatus === 'saving' ? t('common.saving') : t('common.save')}
            </Button>
            {nameStatus === 'saved' ? (
              <span className={styles.saved}>{t('common.saved')}</span>
            ) : null}
          </div>
        </form>
      </section>

      <section className={`ok-glass ${styles.card}`}>
        <h2 className={styles.cardTitle}>{t('account.certificates')}</h2>
        {certificates.length === 0 ? (
          <p className={styles.empty}>{t('account.noCertificates')}</p>
        ) : (
          <ul className={styles.certificates}>
            {certificates.map((certificate) => (
              <li key={certificate.id} className={styles.certificate}>
                <div className={styles.certificateInfo}>
                  <span className={styles.certificateCourse}>{certificate.courseTitle}</span>
                  <span className={styles.certificateMeta}>
                    {certificate.holderName} · {formatDate(certificate.issuedAt)}
                  </span>
                </div>
                {confirmingId === certificate.id ? (
                  <span className={styles.confirm}>
                    <span className={styles.confirmText}>{t('admin.revokeWarning')}</span>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={busyId === certificate.id}
                      onClick={() => handleRevoke(certificate.id)}
                    >
                      {t('admin.revoke')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmingId(null)}
                    >
                      {t('common.cancel')}
                    </Button>
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmingId(certificate.id)}
                  >
                    {t('admin.revoke')}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {errorMessage ? (
        <p role="alert" className={styles.error}>
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
