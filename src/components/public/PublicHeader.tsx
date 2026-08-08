import Link from 'next/link';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import { getCurrentUser } from '@/app/serverAuth';
import settingsFactory from '@/modules/settings/application/factory';
import { LanguageSelector } from './LanguageSelector';
import { UserMenu } from './UserMenu';
import { NotificationsBell } from './NotificationsBell';
import styles from './PublicHeader.module.css';

export async function PublicHeader() {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);
  const settings = await settingsFactory.getInstanceSettings();
  const user = await getCurrentUser();

  return (
    <header className={`ok-glass-strong ${styles.header}`}>
      <Link href="/" className={styles.brand}>
        {settings.getLibraryName()}
      </Link>
      <nav className={styles.nav} aria-label={translate(dictionary, 'nav.library')}>
        {settings.isNewsEnabled() ? (
          <Link href="/news" className={styles.navLink}>
            {translate(dictionary, 'nav.news')}
          </Link>
        ) : null}
        <LanguageSelector />
        {user !== null ? <NotificationsBell /> : null}
        <UserMenu
          user={user ? { identifier: user.getIdentifier(), isAdmin: user.isAdmin() } : null}
        />
      </nav>
    </header>
  );
}
