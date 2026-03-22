import type { Service } from '@/types';
import styles from '@/styles/components.module.css';

interface ServiceCardProps {
  service: Service;
  selected?: boolean;
  onSelect: (service: Service) => void;
}

export function ServiceCard({ service, selected, onSelect }: ServiceCardProps) {
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <div
      className={`${styles.serviceCard} ${selected ? styles.serviceCardSelected : ''}`}
      onClick={() => onSelect(service)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(service)}
      tabIndex={0}
      role="button"
      aria-pressed={selected}
    >
      <div>
        <span className={styles.serviceName}>{service.name}</span>
        <p className={styles.serviceDuration}>
          {formatDuration(service.duration)}
        </p>
      </div>
      <p className={styles.serviceDescription}>
        {service.description}
      </p>
      <div className={styles.servicePrice}>
        ${service.price} USD
      </div>
    </div>
  );
}
