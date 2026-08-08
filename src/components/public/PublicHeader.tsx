import Link from 'next/link';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import { getCurrentUser } from '@/app/serverAuth';
import settingsFactory from '@/modules/settings/application/factory';
import pagesFactory from '@/modules/pages/application/factory';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { NotificationsBell } from './NotificationsBell';
import { MobileMenu } from './MobileMenu';
import styles from './PublicHeader.module.css';

export async function PublicHeader() {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);
  const settings = await settingsFactory.getInstanceSettings();
  const user = await getCurrentUser();
  const menuPages = await pagesFactory.listPages('menu');

  const userInfo = user ? { identifier: user.getIdentifier(), isAdmin: user.isAdmin() } : null;

  return (
    <header className={`ok-glass-strong ${styles.header}`}>
      <Link href="/" className={styles.brand} aria-label={settings.getLibraryName()}>
        {settings.getLogoPath() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={settings.getLogoPath()!}
            alt={settings.getLibraryName()}
            className={styles.brandLogo}
          />
        ) : (
          settings.getLibraryName()
        )}
      </Link>

      {/* Desktop: inline navigation */}
      <nav className={styles.desktopNav} aria-label={translate(dictionary, 'nav.menu')}>
        {settings.isNewsEnabled() ? (
          <Link href="/news" className={styles.navLink}>
            {translate(dictionary, 'nav.news')}
          </Link>
        ) : null}
        {menuPages.map((page) => (
          <Link key={page.getId()} href={`/p/${page.getId()}`} className={styles.navLink}>
            {page.getTitle()}
          </Link>
        ))}
        <ThemeToggle />
        <LanguageSelector />
        {user !== null ? <NotificationsBell /> : null}
        <UserMenu user={userInfo} />
      </nav>

      {/* Mobile: bell + app-like menu sheet */}
      <div className={styles.mobileNav}>
        {user !== null ? <NotificationsBell /> : null}
        <MobileMenu
          newsEnabled={settings.isNewsEnabled()}
          menuPages={menuPages.map((page) => ({ id: page.getId()!, title: page.getTitle() }))}
          user={userInfo}
        />
      </div>
    </header>
  );
}
