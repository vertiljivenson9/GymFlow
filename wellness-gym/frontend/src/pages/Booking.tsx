import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useBooking } from '@/lib/booking-context';
import { Steps } from '@/components/Steps';
import { ServiceSelection } from './ServiceSelection';
import { TimeSelection } from './TimeSelection';
import { CustomerDetails } from './CustomerDetails';
import { Payment } from './Payment';
import styles from '@/styles/components.module.css';

export function Booking() {
  const { isAuthenticated, loading } = useAuth();
  const { state } = useBooking();

  // Must be logged in FIRST
  if (loading) {
    return (
      <div className={styles.container} style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: { pathname: '/book' } }} replace />;
  }

  return (
    <div className={styles.container} style={{ padding: 'var(--space-8) var(--space-4)' }}>
      <div className={styles.content}>
        {state.step !== 'success' && <Steps currentStep={state.step} />}

        {state.step === 'service' && <ServiceSelection />}
        {state.step === 'time' && <TimeSelection />}
        {state.step === 'details' && <CustomerDetails />}
        {(state.step === 'payment' || state.step === 'success') && <Payment />}
      </div>
    </div>
  );
}
