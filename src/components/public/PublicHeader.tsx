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

interface PublicHeaderProps {
  /** When set, an app-style circular back button precedes the brand. */
  backHref?: string;
}

export async function PublicHeader({ backHref }: PublicHeaderProps = {}) {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);
  const settings = await settingsFactory.getInstanceSettings();
  const user = await getCurrentUser();
  const menuPages = await pagesFactory.listPages('menu');

  const userInfo = user ? { identifier: user.getIdentifier(), isAdmin: user.isAdmin() } : null;
  // Static content mode has no accounts: no sign-in, no notifications.
  const identityEnabled = !isStaticMode();

  // Which logo file serves each theme. The dark slot falls back to the light
  // logo (optionally color-inverted); theme switching is pure CSS so the
  // server render never mismatches the client.
  const lightLogo = settings.getLogoPath() ?? settings.getLogoDarkPath();
  const darkLogo = settings.getLogoDarkPath();
  const invertInDark = settings.shouldInvertLogoInDarkMode() && !settings.hasDedicatedDarkLogo();
  const needsDarkSlot = darkLogo !== lightLogo || invertInDark;

  return (
    <header className={`ok-glass-strong ${styles.header}`}>
      <div className={styles.leading}>
        {backHref ? (
          <Link
            href={backHref}
            className={styles.backButton}
            aria-label={translate(dictionary, 'common.back')}
          >
            ←
          </Link>
        ) : null}
        <Link href="/" className={styles.brand} aria-label={settings.getLibraryName()}>
          {lightLogo ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightLogo}
                alt={settings.getLibraryName()}
                className={
                  needsDarkSlot ? `${styles.brandLogo} ${styles.brandLogoLight}` : styles.brandLogo
                }
              />
              {needsDarkSlot ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={darkLogo!}
                  alt={settings.getLibraryName()}
                  className={`${styles.brandLogo} ${styles.brandLogoDark} ${
                    invertInDark ? styles.brandLogoInverted : ''
                  }`}
                />
              ) : null}
            </>
          ) : (
            settings.getLibraryName()
          )}
        </Link>
      </div>

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
