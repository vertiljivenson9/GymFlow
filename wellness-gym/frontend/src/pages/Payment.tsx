import { useState, type FormEvent, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBooking } from '@/lib/booking-context';
import { createPayment } from '@/lib/api';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Alert } from '@/components/Alert';
import styles from '@/styles/components.module.css';

interface CardDetails {
  number: string;
  expiry: string;
  cvc: string;
}

interface FormErrors {
  number?: string;
  expiry?: string;
  cvc?: string;
}

export function Payment() {
  const { state, dispatch, prevStep } = useBooking();
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    number: '',
    expiry: '',
    cvc: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if payment was skipped (user chose not to pay)
  useEffect(() => {
    if (state.step === 'payment' && state.bookingId && !state.selectedService) {
      // Booking created without payment, show success
      dispatch({ type: 'SET_PAYMENT_STATUS', status: 'skipped' });
    }
  }, [state.step, state.bookingId, state.selectedService, dispatch]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    const cleanNumber = cardDetails.number.replace(/\s/g, '');
    if (!cleanNumber || cleanNumber.length < 15) {
      newErrors.number = 'Ingresa un número de tarjeta válido';
    }

    if (!cardDetails.expiry || !/^\d{2}\/\d{2}$/.test(cardDetails.expiry)) {
      newErrors.expiry = 'Usa formato MM/AA';
    }

    if (!cardDetails.cvc || cardDetails.cvc.length < 3) {
      newErrors.cvc = 'Ingresa el CVC';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCardNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join(' ') : '';
  };

  const formatExpiry = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const handleChange = (field: keyof CardDetails, value: string) => {
    let formatted = value;
    if (field === 'number') {
      formatted = formatCardNumber(value);
    } else if (field === 'expiry') {
      formatted = formatExpiry(value);
    } else if (field === 'cvc') {
      formatted = value.replace(/\D/g, '').slice(0, 4);
    }

    setCardDetails((prev) => ({ ...prev, [field]: formatted }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;
    if (!state.bookingId || !state.selectedService) {
      setError('Falta información de la reserva. Por favor empieza de nuevo.');
      return;
    }

    setProcessing(true);
    setError(null);
    dispatch({ type: 'SET_PAYMENT_STATUS', status: 'processing' });

    const response = await createPayment({
      bookingId: state.bookingId,
      amount: state.selectedService.price,
      currency: 'USD',
      paymentMethod: 'card',
    });

    setProcessing(false);

    if (response.success && response.data) {
      if (response.data.status === 'succeeded') {
        dispatch({ type: 'SET_PAYMENT_STATUS', status: 'success' });

        // Update booking as paid in localStorage
        const bookings = JSON.parse(localStorage.getItem('wellness_bookings') || '[]');
        const updatedBookings = bookings.map((b: any) =>
          b.id === state.bookingId ? { ...b, paid: true } : b
        );
        localStorage.setItem('wellness_bookings', JSON.stringify(updatedBookings));

        // Save payment for admin
        const payments = JSON.parse(localStorage.getItem('wellness_payments') || '[]');
        payments.push({
          id: response.data.paymentId,
          userId: state.customerDetails.email,
          userName: state.customerDetails.name,
          userEmail: state.customerDetails.email,
          serviceName: state.selectedService.name,
          amount: state.selectedService.price,
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
        });
        localStorage.setItem('wellness_payments', JSON.stringify(payments));
      } else {
        setError('Error procesando el pago. Intenta de nuevo.');
        dispatch({ type: 'SET_PAYMENT_STATUS', status: 'failed' });
      }
    } else {
      setError(response.error || 'Error en el pago');
      dispatch({ type: 'SET_PAYMENT_STATUS', status: 'failed' });
    }
  };

  // Success state (paid or skipped)
  if (state.paymentStatus === 'success' || state.paymentStatus === 'skipped') {
    const isPaid = state.paymentStatus === 'success';
    return (
      <div className={styles.content} style={{ textAlign: 'center', padding: 'var(--space-12) 0' }}>
        <div style={{
          width: 64,
          height: 64,
          border: '2px solid var(--color-success)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--space-6)',
          color: 'var(--color-success)',
          fontSize: 'var(--text-2xl)',
        }}>
          ✓
        </div>
        <h2 style={{ marginBottom: 'var(--space-3)' }}>
          {isPaid ? '¡Pago Confirmado!' : '¡Reserva Confirmada!'}
        </h2>
        <p className={styles.footerText} style={{ marginBottom: 'var(--space-4)' }}>
          {isPaid
            ? 'Tu reserva está confirmada y pagada. Revisa tu email para los detalles.'
            : 'Tu reserva está confirmada. Puedes pagar en el gimnasio el día de tu sesión.'}
        </p>
        <p className={styles.footerText} style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
          Código de reserva: <strong>{state.bookingId}</strong>
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center' }}>
          <Link to="/dashboard">
            <Button>Ver Mis Reservas</Button>
          </Link>
          <Button variant="secondary" onClick={() => dispatch({ type: 'RESET' })}>
            Nueva Reserva
          </Button>
        </div>
      </div>
    );
  }

  if (!state.selectedService || !state.bookingId) {
    return (
      <Alert variant="error">
        Por favor completa los pasos anteriores
      </Alert>
    );
  }

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h2>Confirmar y Pagar</h2>
        <p className={styles.sectionSubtitle}>
          Pago seguro — los datos de tu tarjeta están encriptados
        </p>
      </div>

      <div className={styles.priceDisplay} style={{ marginBottom: 'var(--space-8)' }}>
        <div className={styles.priceRow}>
          <span>Sesión</span>
          <span>{state.selectedService.name}</span>
        </div>
        <div className={styles.priceRow}>
          <span>Fecha y Hora</span>
          <span>
            {state.selectedDate && new Date(state.selectedDate).toLocaleDateString('es-DO', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })}
            {' '}a las {state.selectedTimeSlot?.startTime}
          </span>
        </div>
        <div className={`${styles.priceRow} ${styles.priceTotal}`}>
          <span>Total</span>
          <span>${state.selectedService.price} USD</span>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Número de Tarjeta"
          value={cardDetails.number}
          onChange={(e) => handleChange('number', e.target.value)}
          error={errors.number}
          placeholder="1234 5678 9012 3456"
          inputMode="numeric"
          autoComplete="cc-number"
        />

        <div className={styles.formRow}>
          <Input
            label="Vencimiento"
            value={cardDetails.expiry}
            onChange={(e) => handleChange('expiry', e.target.value)}
            error={errors.expiry}
            placeholder="MM/AA"
            inputMode="numeric"
            autoComplete="cc-exp"
          />
          <Input
            label="CVC"
            value={cardDetails.cvc}
            onChange={(e) => handleChange('cvc', e.target.value)}
            error={errors.cvc}
            placeholder="123"
            inputMode="numeric"
            autoComplete="cc-csc"
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
          <Button variant="secondary" type="button" onClick={prevStep}>
            Atrás
          </Button>
          <Button
            type="submit"
            variant="accent"
            fullWidth
            size="large"
            loading={processing}
          >
            Pagar ${state.selectedService.price}
          </Button>
        </div>
      </form>
    </div>
  );
}
