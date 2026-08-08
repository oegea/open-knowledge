'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './UserMenu.module.css';

interface UserMenuProps {
  user: { identifier: string; isAdmin: boolean } | null;
}

export function UserMenu({ user }: UserMenuProps) {
  const { t } = useI18n();
  const router = useRouter();

  if (user === null) {
    return (
      <Link href="/login" className={styles.signIn}>
        {t('nav.signIn')}
      </Link>
    );
  }

  const handleLogout = async () => {
    await fetch('/api/identity/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  return (
    <div className={styles.menu}>
      {user.isAdmin ? (
        <Link href="/admin" className={styles.adminLink}>
          {t('nav.admin')}
        </Link>
      ) : null}
      <span className={styles.identifier} title={user.identifier}>
        {user.identifier}
      </span>
      <button className={styles.logout} onClick={handleLogout} aria-label={t('nav.signOut')}>
        ⎋
      </button>
    </div>
  );
}
