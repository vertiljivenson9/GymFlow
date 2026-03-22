import { useEffect, useState } from 'react';
import type { Service } from '@/types';
import { getServices } from '@/lib/api';
import { useBooking } from '@/lib/booking-context';
import { ServiceCard } from '@/components/ServiceCard';
import { Button } from '@/components/Button';
import { Loading } from '@/components/Loading';
import { Alert } from '@/components/Alert';
import styles from '@/styles/components.module.css';

export function ServiceSelection() {
  const { state, dispatch, nextStep } = useBooking();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServices() {
      const response = await getServices();
      if (response.success && response.data) {
        setServices(response.data);
      } else {
        setError(response.error || 'Failed to load services');
      }
      setLoading(false);
    }
    fetchServices();
  }, []);

  const handleSelect = (service: Service) => {
    dispatch({ type: 'SELECT_SERVICE', service });
  };

  const handleContinue = () => {
    if (state.selectedService) {
      nextStep();
    }
  };

  if (loading) {
    return <Loading message="Loading sessions..." />;
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h2>Pick Your Session</h2>
        <p className={styles.sectionSubtitle}>
          Choose from our training sessions, classes, and wellness services
        </p>
      </div>

      <div className={styles.grid} style={{ marginBottom: 'var(--space-8)' }}>
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            selected={state.selectedService?.id === service.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      <Button
        onClick={handleContinue}
        disabled={!state.selectedService}
        fullWidth
        size="large"
      >
        Continue to Time Selection
      </Button>
    </div>
  );
}
