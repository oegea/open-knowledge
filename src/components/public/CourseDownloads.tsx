'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ActionMenu } from './ActionMenu';
import styles from './CourseDownloads.module.css';

export interface CourseDownloadsLabels {
  epub: string;
  pdf: string;
  /** Dialog title. */
  pdfNotesTitle: string;
  /** "Would you like a note-taking page after each material?" */
  pdfNotesQuestion: string;
  pdfNotesAccept: string;
  pdfNotesDecline: string;
  close: string;
}

interface CourseDownloadsProps {
  label: string;
  epubHref: string;
  pdfHref: string;
  labels: CourseDownloadsLabels;
}

/**
 * The course download menu. EPUB downloads straight away; PDF first asks —
 * in a small dialog — whether to interleave note-taking pages after each
 * material (writing helps studying), then downloads the chosen variant.
 */
export function CourseDownloads({ label, epubHref, pdfHref, labels }: CourseDownloadsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setDialogOpen(false), []);

  useEffect(() => {
    if (!dialogOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKey);
    // The dialog is small: moving focus into it is enough keyboard support.
    dialogRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, [dialogOpen, close]);

  return (
    <>
      <ActionMenu
        label={label}
        items={[
          { label: labels.epub, href: epubHref, download: true },
          { label: labels.pdf, href: pdfHref, onSelect: () => setDialogOpen(true) },
        ]}
      />

      {/* Portal: the menu lives inside a glass (backdrop-filter) card, which
          becomes the containing block of any fixed descendant — the overlay
          must escape to the body to actually cover the viewport. */}
      {dialogOpen
        ? createPortal(
        <div className={styles.overlay} onClick={close}>
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pdf-notes-title"
            className={`ok-glass-strong ${styles.dialog}`}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="pdf-notes-title" className={styles.title}>
              {labels.pdfNotesTitle}
            </h2>
            <p className={styles.question}>{labels.pdfNotesQuestion}</p>
            <div className={styles.actions}>
              <a
                href={`${pdfHref}?notes=1`}
                download
                className={styles.accept}
                onClick={close}
              >
                {labels.pdfNotesAccept}
              </a>
              <a href={pdfHref} download className={styles.decline} onClick={close}>
                {labels.pdfNotesDecline}
              </a>
            </div>
            <button type="button" className={styles.close} aria-label={labels.close} onClick={close}>
              ✕
            </button>
          </div>
        </div>,
            document.body
          )
        : null}
    </>
  );
}
