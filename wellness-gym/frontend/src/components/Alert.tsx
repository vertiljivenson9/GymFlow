import type { ReactNode } from 'react';
import styles from '@/styles/components.module.css';

interface AlertProps {
  variant: 'error' | 'success';
  children: ReactNode;
}

export function Alert({ variant, children }: AlertProps) {
  const variantClass = variant === 'error' ? styles.alertError : styles.alertSuccess;

  return (
    <div 
      className={`${styles.alert} ${variantClass}`} 
      role="alert"
    >
      <p className={styles.alertMessage}>{children}</p>
    </div>
  );
}
