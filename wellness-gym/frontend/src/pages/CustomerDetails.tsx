import { useState, type FormEvent } from 'react';
import { useBooking } from '@/lib/booking-context';
import { useAuth } from '@/lib/auth-context';
import { createBooking } from '@/lib/api';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Alert } from '@/components/Alert';
import styles from '@/styles/components.module.css';

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

export function CustomerDetails() {
  const { state, dispatch, nextStep, prevStep } = useBooking();
  const { user } = useAuth();
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wantsPremium, setWantsPremium] = useState(false);

  // Pre-fill form if user is logged in
  const defaultName = user?.displayName || state.customerDetails.name;
  const defaultEmail = user?.email || state.customerDetails.email;

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!state.customerDetails.name.trim()) {
      newErrors.name = 'Nombre es requerido';
    }

    if (!state.customerDetails.email.trim()) {
      newErrors.email = 'Email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.customerDetails.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!state.customerDetails.phone.trim()) {
      newErrors.phone = 'Teléfono es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof typeof state.customerDetails, value: string) => {
    dispatch({
      type: 'SET_CUSTOMER_DETAILS',
      details: {
        ...state.customerDetails,
        [field]: value,
      },
    });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;
    if (!state.selectedService || !state.selectedDate || !state.selectedTimeSlot) {
      setError('Falta información de la reserva. Por favor empieza de nuevo.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const response = await createBooking({
      serviceId: state.selectedService.id,
      date: state.selectedDate,
      timeSlotId: state.selectedTimeSlot.id,
      customerName: state.customerDetails.name,
      customerEmail: state.customerDetails.email,
      customerPhone: state.customerDetails.phone,
    });

    setSubmitting(false);

    if (response.success && response.data) {
      dispatch({ type: 'SET_BOOKING_ID', bookingId: response.data.id });

      // Save booking to localStorage for dashboard
      const bookings = JSON.parse(localStorage.getItem('wellness_bookings') || '[]');
      bookings.push({
        id: response.data.id,
        serviceName: state.selectedService.name,
        date: state.selectedDate,
        time: state.selectedTimeSlot.startTime,
        status: 'confirmed',
        paid: false,
      });
      localStorage.setItem('wellness_bookings', JSON.stringify(bookings));

      if (wantsPremium) {
        nextStep(); // Go to payment
      } else {
        // Skip payment, go directly to success
        dispatch({ type: 'SET_STEP', step: 'payment' });
      }
    } else {
      setError(response.error || 'Error al crear la reserva');
    }
  };

  if (!state.selectedService || !state.selectedTimeSlot) {
    return (
      <Alert variant="error">
        Por favor completa los pasos anteriores
      </Alert>
    );
  }

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h2>Tus Datos</h2>
        <p className={styles.sectionSubtitle}>
          Te enviaremos la confirmación a este email
        </p>
      </div>

      <div className={styles.priceDisplay} style={{ marginBottom: 'var(--space-8)' }}>
        <div className={styles.priceRow}>
          <span>Sesión</span>
          <span>{state.selectedService.name}</span>
        </div>
        <div className={styles.priceRow}>
          <span>Fecha</span>
          <span>{new Date(state.selectedDate).toLocaleDateString('es-DO', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          })}</span>
        </div>
        <div className={styles.priceRow}>
          <span>Hora</span>
          <span>{state.selectedTimeSlot.startTime} — {state.selectedTimeSlot.endTime}</span>
        </div>
        <div className={`${styles.priceRow} ${styles.priceTotal}`}>
          <span>Total</span>
          <span>${state.selectedService.price} USD</span>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Nombre Completo"
          value={state.customerDetails.name || defaultName}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          placeholder="Tu nombre"
          autoComplete="name"
        />

        <Input
          label="Email"
          type="email"
          value={state.customerDetails.email || defaultEmail}
          onChange={(e) => handleChange('email', e.target.value)}
          error={errors.email}
          placeholder="tu@email.com"
          autoComplete="email"
        />

        <Input
          label="Teléfono"
          type="tel"
          value={state.customerDetails.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          error={errors.phone}
          placeholder="+1 809 123 4567"
          autoComplete="tel"
        />

        <div className={styles.card} style={{ padding: 'var(--space-4)', marginTop: 'var(--space-4)', backgroundColor: 'var(--color-gray-100)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={wantsPremium}
              onChange={(e) => setWantsPremium(e.target.checked)}
              style={{ width: '20px', height: '20px' }}
            />
            <div>
              <p style={{ fontWeight: 'var(--font-medium)' }}>Pago Premium (Opcional)</p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)' }}>
                Paga ahora para asegurar tu reservación y obtener beneficios exclusivos
              </p>
            </div>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
          <Button variant="secondary" type="button" onClick={prevStep}>
            Atrás
          </Button>
          <Button
            type="submit"
            fullWidth
            size="large"
            loading={submitting}
          >
            {wantsPremium ? 'Continuar al Pago' : 'Reservar Sin Pagar'}
          </Button>
        </div>

        {!wantsPremium && (
          <p style={{ textAlign: 'center', marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)' }}>
            Puedes pagar más tarde en el gimnasio
          </p>
        )}
      </form>
    </div>
  );
}
