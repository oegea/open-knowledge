'use client';

import { useRef } from 'react';
import { Button } from '../ui/Button';
import styles from './SettingsForm.module.css';

interface LogoFieldProps {
  label: string;
  hint: string;
  value: string | null;
  uploading: boolean;
  uploadLabel: string;
  uploadingLabel: string;
  deleteLabel: string;
  onUpload: (file: File | undefined) => void;
  onClear: () => void;
}

/** One uploadable logo slot with preview and clear action. */
export function LogoField({
  label,
  hint,
  value,
  uploading,
  uploadLabel,
  uploadingLabel,
  deleteLabel,
  onUpload,
  onClear,
}: LogoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.logoBlock}>
      <span className={styles.logoLabel}>{label}</span>
      <p className={styles.logoHint}>{hint}</p>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className={styles.logoPreview} />
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className={styles.fileInput}
        onChange={(event) => onUpload(event.target.files?.[0])}
      />
      <div className={styles.logoActions}>
        <Button
          type="button"
          variant="soft"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? uploadingLabel : uploadLabel}
        </Button>
        {value ? (
          <Button type="button" variant="danger" size="sm" onClick={onClear}>
            {deleteLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
