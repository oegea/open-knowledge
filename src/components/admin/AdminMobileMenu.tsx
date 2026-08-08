'use client';

import { useEffect, useState } from 'react';
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
import styles from '../public/MobileMenu.module.css';

/** App-like navigation sheet for the admin area on small screens. */
export function AdminMobileMenu() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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

      {open ? (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <nav
            className={`ok-glass-strong ${styles.sheet}`}
            aria-label={t('nav.menu')}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.sheetHeader}>
              <span className={styles.sheetTitle}>{t('nav.admin')}</span>
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
                <Link href="/admin" className={styles.item}>
                  <IconLibrary className={styles.itemIcon} />
                  {t('admin.courses')}
                </Link>
              </li>
              <li>
                <Link href="/admin/news" className={styles.item}>
                  <IconNews className={styles.itemIcon} />
                  {t('admin.news')}
                </Link>
              </li>
              <li>
                <Link href="/admin/pages" className={styles.item}>
                  <IconPage className={styles.itemIcon} />
                  {t('admin.pages')}
                </Link>
              </li>
              <li>
                <Link href="/admin/users" className={styles.item}>
                  <IconUser className={styles.itemIcon} />
                  {t('admin.users')}
                </Link>
              </li>
              <li>
                <Link href="/admin/settings" className={styles.item}>
                  <IconGear className={styles.itemIcon} />
                  {t('admin.settings')}
                </Link>
              </li>

              <li className={styles.divider} role="presentation" />

              <li>
                <Link href="/" className={styles.item}>
                  <IconLibrary className={styles.itemIcon} />
                  {t('nav.library')}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      ) : null}
    </>
  );
}
