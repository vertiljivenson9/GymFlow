import { useEffect, useState, useCallback } from 'react';
import type { Availability, TimeSlot } from '@/types';
import { getAvailability } from '@/lib/api';
import { useBooking } from '@/lib/booking-context';
import { DatePicker } from '@/components/DatePicker';
import { TimePicker } from '@/components/TimePicker';
import { Button } from '@/components/Button';
import { Loading } from '@/components/Loading';
import { Alert } from '@/components/Alert';
import styles from '@/styles/components.module.css';

export function TimeSelection() {
  const { state, dispatch, nextStep, prevStep } = useBooking();
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function fetchAvailability() {
      if (!state.selectedService) return;
      
      setLoading(true);
      const response = await getAvailability(state.selectedService.id, today);
      
      if (response.success && response.data) {
        setAvailability(response.data);
      } else {
        setError(response.error || 'Failed to load availability');
      }
      setLoading(false);
    }
    fetchAvailability();
  }, [state.selectedService, today]);

  const handleDateSelect = useCallback((date: string) => {
    dispatch({ type: 'SELECT_DATE', date });
  }, [dispatch]);

  const handleTimeSelect = useCallback((slot: TimeSlot) => {
    dispatch({ type: 'SELECT_TIME', timeSlot: slot });
  }, [dispatch]);

  const currentSlots = availability.find(
    (a) => a.date === state.selectedDate
  )?.slots || [];

  const availableDates = availability
    .filter((a) => a.slots.some((s) => s.available))
    .map((a) => a.date);

  const handleContinue = () => {
    if (state.selectedDate && state.selectedTimeSlot) {
      nextStep();
    }
  };

  if (!state.selectedService) {
    return (
      <Alert variant="error">
        Please select a service first
      </Alert>
    );
  }

  if (loading) {
    return <Loading message="Checking availability..." />;
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h2>Choose a Time</h2>
        <p className={styles.sectionSubtitle}>
          {state.selectedService.name} — ${state.selectedService.price}
        </p>
      </div>

      <section style={{ marginBottom: 'var(--space-8)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)' }}>Select Date</h3>
        <DatePicker
          selectedDate={state.selectedDate}
          onDateSelect={handleDateSelect}
          availableDates={availableDates}
        />
      </section>

      {state.selectedDate && (
        <section style={{ marginBottom: 'var(--space-8)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Available Times</h3>
          <TimePicker
            slots={currentSlots}
            selectedSlot={state.selectedTimeSlot}
            onSlotSelect={handleTimeSelect}
          />
        </section>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
        <Button variant="secondary" onClick={prevStep}>
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!state.selectedDate || !state.selectedTimeSlot}
          fullWidth
        >
          Continue to Details
        </Button>
      </div>
    </div>
  );
}
