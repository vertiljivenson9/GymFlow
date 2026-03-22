import type { BookingStep } from '@/types';
import styles from '@/styles/components.module.css';

interface StepsProps {
  currentStep: BookingStep;
}

const steps: Array<{ key: BookingStep; label: string }> = [
  { key: 'service', label: 'Session' },
  { key: 'time', label: 'Time' },
  { key: 'details', label: 'Details' },
  { key: 'payment', label: 'Pay' },
];

export function Steps({ currentStep }: StepsProps) {
  const currentIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <nav className={styles.steps} aria-label="Booking progress">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;
        
        return (
          <div
            key={step.key}
            className={`${styles.step} ${isActive ? styles.stepActive : ''} ${isCompleted ? styles.stepCompleted : ''}`}
            aria-current={isActive ? 'step' : undefined}
          >
            <span className={styles.stepNumber}>
              {isCompleted ? '✓' : index + 1}
            </span>
            <span className={styles.stepLabel}>{step.label}</span>
          </div>
        );
      })}
    </nav>
  );
}
