'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LOCALES } from '@/i18n/config';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './LanguageSelector.module.css';

const OPTION_HEIGHT = 44;
const MENU_WIDTH = 208;
const MENU_PADDING = 12; // inner padding + glass border
const EDGE_MARGIN = 8;

export function LanguageSelector() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const current = LOCALES.find((info) => info.code === locale);

  /**
   * The menu renders in a portal with fixed positioning: inside the mobile
   * sheet (a scroll container under a glass header) an absolute dropdown
   * gets clipped and forces inner scrolling. Anchored to the trigger, it
   * opens downward when there is room and upward otherwise, never taller
   * than the space it actually has.
   */
  const handleToggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const wantedHeight = LOCALES.length * OPTION_HEIGHT + MENU_PADDING;
      const spaceBelow = window.innerHeight - rect.bottom - EDGE_MARGIN * 2;
      const spaceAbove = rect.top - EDGE_MARGIN * 2;
      const openUp = spaceBelow < wantedHeight && spaceAbove > spaceBelow;
      const available = openUp ? spaceAbove : spaceBelow;

      // Align with the trigger's left edge, clamped inside the viewport.
      const left = Math.min(
        Math.max(EDGE_MARGIN, rect.left),
        window.innerWidth - MENU_WIDTH - EDGE_MARGIN
      );

      setMenuStyle({
        position: 'fixed',
        left,
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + EDGE_MARGIN }
          : { top: rect.bottom + EDGE_MARGIN }),
        maxHeight: Math.min(wantedHeight, available),
      });
    }
    setOpen(!open);
  };

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('touchstart', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('touchstart', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className={styles.container}>
      <button
        ref={triggerRef}
        className={styles.trigger}
        aria-label={t('language.label')}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={handleToggle}
      >
        <span className={styles.iso}>{current?.iso}</span>
      </button>

      {open
        ? createPortal(
            <ul
              ref={menuRef}
              role="listbox"
              aria-label={t('language.label')}
              className={`ok-glass-strong ${styles.menu}`}
              style={menuStyle}
            >
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
            </ul>,
            document.body
          )
        : null}
    </div>
  );
}
