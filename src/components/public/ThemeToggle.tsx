'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { IconMoon, IconSun, IconThemeAuto } from '../ui/icons';
import styles from './ThemeToggle.module.css';

type Theme = 'auto' | 'light' | 'dark';

const ORDER: Theme[] = ['auto', 'light', 'dark'];

function applyTheme(theme: Theme) {
  if (theme === 'auto') {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = theme;
  }
}

export function ThemeToggle() {
  const { t } = useI18n();
  const [theme, setTheme] = useState<Theme>('auto');

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    if (current === 'light' || current === 'dark') setTheme(current);
  }, []);

  const handleToggle = () => {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
    applyTheme(next);
    document.cookie = `ok_theme=${next};path=/;max-age=31536000;samesite=lax`;
  };

  return (
    <button
      className={styles.toggle}
      onClick={handleToggle}
      aria-label={`${t('theme.label')}: ${t(`theme.${theme}`)}`}
      title={`${t('theme.label')}: ${t(`theme.${theme}`)}`}
    >
      <span aria-hidden="true" className={styles.icon}>
        {theme === 'light' ? <IconSun /> : theme === 'dark' ? <IconMoon /> : <IconThemeAuto />}
      </span>
    </button>
  );
}
