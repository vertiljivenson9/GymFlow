import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import styles from '@/styles/components.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'default' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'default',
  fullWidth = false,
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const variantClass = {
    primary: styles.buttonPrimary,
    secondary: styles.buttonSecondary,
    accent: styles.buttonAccent,
  }[variant];

  const sizeClass = size === 'large' ? styles.buttonLarge : '';
  const widthClass = fullWidth ? styles.buttonFull : '';
  const disabledClass = disabled || loading ? styles.buttonDisabled : '';

  return (
    <button
      className={`${styles.button} ${variantClass} ${sizeClass} ${widthClass} ${disabledClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className={styles.spinner} />
      ) : children}
    </button>
  );
}
