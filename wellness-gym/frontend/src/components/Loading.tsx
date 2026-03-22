import styles from '@/styles/components.module.css';

interface LoadingProps {
  message?: string;
}

export function Loading({ message = 'Loading...' }: LoadingProps) {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <span className={styles.spinner} />
      <span className="sr-only">{message}</span>
    </div>
  );
}
