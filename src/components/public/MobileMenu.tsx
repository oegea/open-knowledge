'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/i18n/I18nProvider';
import {
  IconClose,
  IconGear,
  IconLibrary,
  IconMenu,
  IconNews,
  IconPage,
  IconUser,
} from '../ui/icons';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSelector } from './LanguageSelector';
import styles from './MobileMenu.module.css';

export interface MenuPageLink {
  id: string;
  slug: string;
  title: string;
}

interface MobileMenuProps {
  newsEnabled: boolean;
  menuPages: MenuPageLink[];
  user: { identifier: string; isAdmin: boolean } | null;
  /** False in static content mode: no sign-in entry at all. */
  identityEnabled?: boolean;
}

/** App-like navigation sheet for small screens. */
export function MobileMenu({ newsEnabled, menuPages, user, identityEnabled = true }: MobileMenuProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Any navigation closes the sheet.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        className={styles.trigger}
        aria-label={t('nav.menu')}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <IconMenu />
      </button>

      {/* Portaled to <body>: the glass header's backdrop-filter turns it
          into a containing block, which would clip this fixed overlay. */}
      {open
        ? createPortal(
            <div className={styles.overlay} onClick={() => setOpen(false)}>
          <nav
            className={`ok-glass-strong ${styles.sheet}`}
            aria-label={t('nav.menu')}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.sheetHeader}>
              <span className={styles.sheetTitle}>{t('nav.menu')}</span>
              <button
                className={styles.closeButton}
                aria-label={t('common.cancel')}
                onClick={() => setOpen(false)}
              >
                <IconClose />
              </button>
            </div>

            <ul className={styles.items}>
              <li>
                <Link href="/" className={styles.item}>
                  <IconLibrary className={styles.itemIcon} />
                  {t('nav.library')}
                </Link>
              </li>
              <li>
                <Link href="/courses" className={styles.item}>
                  <IconLibrary className={styles.itemIcon} />
                  {t('nav.courses')}
                </Link>
              </li>
              {newsEnabled ? (
                <li>
                  <Link href="/news" className={styles.item}>
                    <IconNews className={styles.itemIcon} />
                    {t('nav.news')}
                  </Link>
                </li>
              ) : null}
              {menuPages.map((page) => (
                <li key={page.id}>
                  <Link href={`/p/${page.slug || page.id}`} className={styles.item}>
                    <IconPage className={styles.itemIcon} />
                    {page.title}
                  </Link>
                </li>
              ))}

              <li className={styles.divider} role="presentation" />

              {user ? (
                <>
                  <li>
                    <Link href="/account" className={styles.item}>
                      <IconUser className={styles.itemIcon} />
                      <span className={styles.itemStack}>
                        {t('auth.myAccount')}
                        <span className={styles.itemHint}>{user.identifier}</span>
                      </span>
                    </Link>
                  </li>
                  {user.isAdmin ? (
                    <li>
                      <Link href="/admin" className={styles.item}>
                        <IconGear className={styles.itemIcon} />
                        {t('nav.admin')}
                      </Link>
                    </li>
                  ) : null}
                </>
              ) : identityEnabled ? (
                <li>
                  <Link href="/login" className={styles.item}>
                    <IconUser className={styles.itemIcon} />
                    {t('nav.signIn')}
                  </Link>
                </li>
              ) : null}
            </ul>

            <div className={styles.preferences}>
              <ThemeToggle />
              <LanguageSelector />
            </div>
          </nav>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
