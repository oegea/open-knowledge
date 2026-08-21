'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import styles from './ActionMenu.module.css';

export interface ActionMenuItem {
  label: string;
  href: string;
  /** Opens in a new tab (external tutors) instead of downloading. */
  external?: boolean;
  download?: boolean;
  /**
   * When set, the entry acts as a button (the caller decides what happens —
   * e.g. opening a dialog) instead of navigating to `href`.
   */
  onSelect?: () => void;
}

interface ActionMenuProps {
  label: ReactNode;
  items: ActionMenuItem[];
  variant?: 'outline' | 'primary';
}

/** A button that unfolds a small list of link actions (downloads, tutors). */
export function ActionMenu({ label, items, variant = 'outline' }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
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
    <div className={styles.container} ref={containerRef}>
      <button
        className={variant === 'primary' ? styles.triggerPrimary : styles.trigger}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen(!open)}
      >
        {label}
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} aria-hidden="true">
          ⌄
        </span>
      </button>

      {open ? (
        <ul role="menu" className={`ok-glass-strong ${styles.menu}`}>
          {items.map((item) => (
            <li key={item.href} role="none">
              {item.onSelect ? (
                <button
                  role="menuitem"
                  type="button"
                  className={styles.item}
                  onClick={() => {
                    setOpen(false);
                    item.onSelect!();
                  }}
                >
                  {item.label}
                </button>
              ) : (
                <a
                  role="menuitem"
                  href={item.href}
                  className={styles.item}
                  {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  {...(item.download ? { download: true } : {})}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                  {item.external ? <span aria-hidden="true"> ↗</span> : null}
                </a>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
