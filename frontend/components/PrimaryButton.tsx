import { type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';
import styles from './primary-button.module.css';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function PrimaryButton({ children, loading, className, disabled, ...props }: PrimaryButtonProps) {
  return (
    <button className={clsx(styles.button, className)} disabled={disabled || loading} {...props}>
      {loading ? <span className={styles.spinner} aria-label="Loading" /> : children}
    </button>
  );
}
