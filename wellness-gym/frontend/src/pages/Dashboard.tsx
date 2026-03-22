import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useGym } from '@/lib/gym-context';
import { Button } from '@/components/Button';
import styles from '@/styles/components.module.css';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
}

interface Booking {
  id: string;
  serviceName: string;
  date: string;
  time: string;
  status: string;
  paid: boolean;
}

const defaultServices: Service[] = [
  { id: '1', name: 'Personal Training', description: 'Entrenamiento personalizado uno a uno', duration: 60, price: 50 },
  { id: '2', name: 'Boxing Class', description: 'Clase de boxeo con instructores certificados', duration: 60, price: 40 },
  { id: '3', name: 'Group Fitness', description: 'Clases en grupo de diferentes disciplinas', duration: 45, price: 25 },
  { id: '4', name: 'Yoga', description: 'Sesión de yoga y meditación', duration: 60, price: 20 },
];

export function Dashboard() {
  const { user, logout } = useAuth();
  const { gym } = useGym();
  const [activeTab, setActiveTab] = useState<'services' | 'bookings' | 'about'>('services');
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('gymflow_bookings');
    if (stored) {
      try {
        setBookings(JSON.parse(stored));
      } catch (e) { }
    }
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <main className={styles.section}>
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-1)' }}>
              Bienvenido, {user?.displayName}
            </h1>
            <p style={{ color: 'var(--color-gray-600)' }}>
              {gym ? gym.name : 'GymFlow'} • {user?.email}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            {(user?.role === 'gym_admin' || user?.role === 'super_admin') && (
              <Link to="/admin">
                <Button variant="secondary">Panel Admin</Button>
              </Link>
            )}
            <Button variant="secondary" onClick={handleLogout}>Cerrar Sesión</Button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-8)', borderBottom: 'var(--border-width) solid var(--border-color)' }}>
          {(['services', 'bookings', 'about'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: 'var(--space-3) var(--space-4)',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--color-black)' : 'none',
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                color: activeTab === tab ? 'var(--color-black)' : 'var(--color-gray-500)',
              }}
            >
              {tab === 'services' ? 'Servicios' : tab === 'bookings' ? 'Mis Reservas' : 'Acerca de'}
            </button>
          ))}
        </div>

        {/* Services */}
        {activeTab === 'services' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <h2>Nuestros Servicios</h2>
              <Link to="/book">
                <Button>Reservar Sesión</Button>
              </Link>
            </div>
            <div className={`${styles.grid} ${styles.grid2}`}>
              {defaultServices.map((service) => (
                <div key={service.id} className={styles.card} style={{ padding: 'var(--space-6)' }}>
                  <h3 style={{ marginBottom: 'var(--space-2)' }}>{service.name}</h3>
                  <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
                    {service.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-500)' }}>
                      {service.duration} min
                    </span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)' }}>
                      ${service.price} USD
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bookings */}
        {activeTab === 'bookings' && (
          <div>
            <h2 style={{ marginBottom: 'var(--space-6)' }}>Mis Reservas</h2>
            {bookings.length === 0 ? (
              <div className={styles.card} style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--space-4)' }}>
                  No tienes reservas aún
                </p>
                <Link to="/book">
                  <Button>Reservar Ahora</Button>
                </Link>
              </div>
            ) : (
              <div className={styles.grid}>
                {bookings.map((booking) => (
                  <div key={booking.id} className={styles.card} style={{ padding: 'var(--space-5)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h3 style={{ marginBottom: 'var(--space-1)' }}>{booking.serviceName}</h3>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)' }}>
                          {booking.date} a las {booking.time}
                        </p>
                      </div>
                      <span style={{
                        padding: 'var(--space-1) var(--space-3)',
                        fontSize: 'var(--text-xs)',
                        textTransform: 'uppercase',
                        border: 'var(--border-width) solid',
                        borderColor: booking.paid ? 'var(--color-success)' : 'var(--color-gray-400)',
                        color: booking.paid ? 'var(--color-success)' : 'var(--color-gray-600)',
                      }}>
                        {booking.paid ? 'Pagado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* About */}
        {activeTab === 'about' && (
          <div>
            <h2 style={{ marginBottom: 'var(--space-6)' }}>
              Acerca de {gym ? gym.name : 'nuestro gimnasio'}
            </h2>
            <div className={styles.card} style={{ padding: 'var(--space-8)' }}>
              {gym ? (
                <>
                  <p style={{ marginBottom: 'var(--space-4)', lineHeight: 'var(--leading-relaxed)' }}>
                    {gym.description}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
                    <div>
                      <p style={{ fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>Dirección</p>
                      <p style={{ color: 'var(--color-gray-600)' }}>{gym.address}</p>
                    </div>
                    <div>
                      <p style={{ fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>Teléfono</p>
                      <p style={{ color: 'var(--color-gray-600)' }}>{gym.phone}</p>
                    </div>
                    <div>
                      <p style={{ fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>Email</p>
                      <p style={{ color: 'var(--color-gray-600)' }}>{gym.email}</p>
                    </div>
                    <div>
                      <p style={{ fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>Plan</p>
                      <p style={{ color: 'var(--color-gray-600)', textTransform: 'capitalize' }}>{gym.plan}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p style={{ lineHeight: 'var(--leading-relaxed)' }}>
                  GymFlow es la plataforma líder en gestión de gimnasios en República Dominicana y el Caribe.
                  Ofrecemos una solución completa para que los gimnasios puedan gestionar sus reservas,
                  pagos, membresías y más desde un solo lugar.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
