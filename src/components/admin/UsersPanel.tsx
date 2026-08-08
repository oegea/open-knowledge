'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '../ui/Button';
import styles from './UsersPanel.module.css';

export interface UserListItem {
  id: string;
  identifier: string;
  displayName: string;
  isAdmin: boolean;
  createdAt: string;
}

interface UsersPanelProps {
  currentUserId: string;
  initialUsers: UserListItem[];
}

export function UsersPanel({ currentUserId, initialUsers }: UsersPanelProps) {
  const { t, locale } = useI18n();
  const [users, setUsers] = useState(initialUsers);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePromote = async (id: string) => {
    setBusyId(id);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/identity/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: true }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? t('common.error'));
      setUsers((current) => current.map((user) => (user.id === id ? body.user : user)));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/identity/users/${id}`, { method: 'DELETE' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? t('common.error'));
      setUsers((current) => current.filter((user) => user.id !== id));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setBusyId(null);
      setConfirmingId(null);
    }
  };

  return (
    <div className={styles.panel}>
      {errorMessage ? (
        <p role="alert" className={styles.error}>
          {errorMessage}
        </p>
      ) : null}

      <ul className={styles.list}>
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          const isBusy = busyId === user.id;
          return (
            <li key={user.id} className={`ok-glass ${styles.row}`}>
              <Link href={`/admin/users/${user.id}`} className={styles.identity}>
                <span className={styles.identifier}>{user.identifier}</span>
                {user.displayName ? (
                  <span className={styles.displayName}>{user.displayName}</span>
                ) : null}
                <span className={styles.since}>
                  {new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
                    new Date(user.createdAt)
                  )}
                </span>
              </Link>

              <div className={styles.actions}>
                {user.isAdmin ? (
                  <span className={styles.adminBadge}>
                    {t('admin.adminRole')}
                    {isSelf ? ` — ${t('admin.you')}` : ''}
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="soft"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => handlePromote(user.id)}
                  >
                    {t('admin.makeAdmin')}
                  </Button>
                )}

                {isSelf ? null : confirmingId === user.id ? (
                  <span className={styles.confirm}>
                    <span className={styles.confirmText}>{t('admin.deleteUserWarning')}</span>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => handleDelete(user.id)}
                    >
                      {t('common.delete')}
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
                    onClick={() => setConfirmingId(user.id)}
                  >
                    {t('common.delete')}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
