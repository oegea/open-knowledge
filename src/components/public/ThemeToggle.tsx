'use client';

import { useI18n } from '@/i18n/I18nProvider';
import { IconMoon, IconSun } from '../ui/icons';
import styles from './ThemeToggle.module.css';

function resolveTheme(): 'light' | 'dark' {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === 'light' || explicit === 'dark') return explicit;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Binary light/dark switch. The system preference only decides the initial
 * theme (no cookie, no data-theme attribute); toggling always moves to the
 * opposite of whatever is currently resolved. Which icon shows is driven
 * purely by CSS, so the server render never mismatches the client.
 */
export function ThemeToggle() {
  const { t } = useI18n();

  const handleToggle = () => {
    const next = resolveTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    document.cookie = `ok_theme=${next};path=/;max-age=31536000;samesite=lax`;
  };

  return (
    <button
      className={styles.toggle}
      onClick={handleToggle}
      aria-label={t('theme.label')}
      title={t('theme.label')}
    >
      <span aria-hidden="true" className={`${styles.icon} ${styles.sun}`}>
        <IconSun />
      </span>
      <span aria-hidden="true" className={`${styles.icon} ${styles.moon}`}>
        <IconMoon />
      </span>
    </button>
  );
}
