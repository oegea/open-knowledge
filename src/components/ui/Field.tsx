'use client';

import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, useId } from 'react';
import styles from './Field.module.css';

interface FieldWrapperProps {
  label: string;
  hint?: string;
  htmlFor: string;
  children: ReactNode;
}

function FieldWrapper({ label, hint, htmlFor, children }: FieldWrapperProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export function TextField({ label, hint, ...rest }: TextFieldProps) {
  const id = useId();
  return (
    <FieldWrapper label={label} hint={hint} htmlFor={id}>
      <input id={id} className={styles.input} {...rest} />
    </FieldWrapper>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
}

export function TextAreaField({ label, hint, ...rest }: TextAreaFieldProps) {
  const id = useId();
  return (
    <FieldWrapper label={label} hint={hint} htmlFor={id}>
      <textarea id={id} className={styles.textarea} {...rest} />
    </FieldWrapper>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  children: ReactNode;
}

export function SelectField({ label, hint, children, ...rest }: SelectFieldProps) {
  const id = useId();
  return (
    <FieldWrapper label={label} hint={hint} htmlFor={id}>
      <select id={id} className={styles.select} {...rest}>
        {children}
      </select>
    </FieldWrapper>
  );
}

interface CheckboxFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export function CheckboxField({ label, hint, ...rest }: CheckboxFieldProps) {
  const id = useId();
  return (
    <div className={styles.checkboxField}>
      <input id={id} type="checkbox" className={styles.checkbox} {...rest} />
      <div>
        <label className={styles.checkboxLabel} htmlFor={id}>
          {label}
        </label>
        {hint ? <p className={styles.hint}>{hint}</p> : null}
      </div>
    </div>
  );
}
