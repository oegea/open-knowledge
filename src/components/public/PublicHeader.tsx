import Link from 'next/link';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary, translate } from '@/i18n/dictionary';
import { getCurrentUser } from '@/app/serverAuth';
import settingsFactory from '@/modules/settings/application/factory';
import { isStaticMode } from '@/modules/shared/infrastructure/StaticContentClient';
import pagesFactory from '@/modules/pages/application/factory';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { NotificationsBell } from './NotificationsBell';
import { MobileMenu } from './MobileMenu';
import { PublicNavLinks } from './PublicNavLinks';
import styles from './PublicHeader.module.css';

export async function PublicHeader() {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);
  const settings = await settingsFactory.getInstanceSettings();
  const user = await getCurrentUser();
  const menuPages = await pagesFactory.listPages('menu');

  const userInfo = user ? { identifier: user.getIdentifier(), isAdmin: user.isAdmin() } : null;
  // Static content mode has no accounts: no sign-in, no notifications.
  const identityEnabled = !isStaticMode();

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

      {/* Desktop: content links sit next to the brand; actions go right. */}
      <PublicNavLinks
        label={translate(dictionary, 'nav.menu')}
        links={[
          { href: '/courses', label: translate(dictionary, 'nav.courses') },
          ...(settings.isNewsEnabled()
            ? [{ href: '/news', label: translate(dictionary, 'nav.news') }]
            : []),
          ...menuPages.map((page) => ({
            href: `/p/${page.getSlug() || page.getId()}`,
            label: page.getTitle(),
          })),
        ]}
      />
      <div className={styles.desktopActions}>
        <ThemeToggle />
        <LanguageSelector />
        {user !== null ? <NotificationsBell /> : null}
        {identityEnabled ? <UserMenu user={userInfo} /> : null}
      </div>

      {/* Mobile: bell + app-like menu sheet */}
      <div className={styles.mobileNav}>
        {user !== null ? <NotificationsBell /> : null}
        <MobileMenu
          newsEnabled={settings.isNewsEnabled()}
          menuPages={menuPages.map((page) => ({
            id: page.getId()!,
            slug: page.getSlug(),
            title: page.getTitle(),
          }))}
          user={userInfo}
          identityEnabled={identityEnabled}
        />
      </div>
    </header>
  );
}
