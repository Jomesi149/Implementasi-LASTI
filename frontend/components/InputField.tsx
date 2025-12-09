import { type InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';
import styles from './input-field.module.css';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(function InputField(
  { label, hint, error, className, ...props },
  ref,
) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input ref={ref} className={clsx(styles.input, error && styles.error, className)} {...props} />
      <span className={clsx(styles.meta, error && styles.metaError)}>{error ?? hint}</span>
    </label>
  );
});
