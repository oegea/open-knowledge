'use client';

import { useEffect, useRef, useState } from 'react';
import { LOCALES } from '@/i18n/config';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './LanguageSelector.module.css';

export function LanguageSelector() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((info) => info.code === locale);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        className={styles.trigger}
        aria-label={t('language.label')}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen(!open)}
      >
        <span className={styles.iso}>{current?.iso}</span>
      </button>

      {open ? (
        <ul role="listbox" aria-label={t('language.label')} className={`ok-glass-strong ${styles.menu}`}>
          {LOCALES.map((info) => (
            <li key={info.code}>
              <button
                role="option"
                aria-selected={info.code === locale}
                className={styles.option}
                onClick={() => {
                  setLocale(info.code);
                  setOpen(false);
                }}
              >
                <span className={styles.optionIso}>{info.iso}</span>
                <span className={styles.optionName}>{info.nativeName}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
