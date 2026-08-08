'use client';

import Link from 'next/link';
import { useI18n } from '@/i18n/I18nProvider';
import { IconGear, IconUser } from '../ui/icons';
import styles from './UserMenu.module.css';

interface UserMenuProps {
  user: { identifier: string; isAdmin: boolean } | null;
}

export function UserMenu({ user }: UserMenuProps) {
  const { t } = useI18n();

  if (user === null) {
    return (
      <Link href="/login" className={styles.signIn}>
        {t('nav.signIn')}
      </Link>
    );
  }

  return (
    <div className={styles.menu}>
      {user.isAdmin ? (
        <Link href="/admin" className={styles.adminLink} aria-label={t('nav.admin')}>
          <IconGear />
          <span className={styles.adminLinkText}>{t('nav.admin')}</span>
        </Link>
      ) : null}
      <Link
        href="/account"
        className={styles.identifier}
        title={user.identifier}
        aria-label={user.identifier}
      >
        <span className={styles.identifierIcon} aria-hidden="true">
          <IconUser width={16} height={16} />
        </span>
        <span className={styles.identifierText}>{user.identifier}</span>
      </Link>
    </div>
  );
}
