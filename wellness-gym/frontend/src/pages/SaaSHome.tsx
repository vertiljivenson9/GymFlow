import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import styles from '@/styles/components.module.css';

const features = [
  {
    title: 'Gestión Multi-Sede',
    description: 'Administra múltiples ubicaciones desde un solo panel. Cada gimnasio con su propia marca y configuración.',
  },
  {
    title: 'Reservas Online 24/7',
    description: 'Tus miembros pueden reservar clases y sesiones en cualquier momento. Sistema de pagos integrado.',
  },
  {
    title: 'Panel de Administración',
    description: 'Dashboard completo con métricas, reportes de ingresos, asistencia y rendimiento del equipo.',
  },
  {
    title: 'App para Entrenadores',
    description: 'Los entrenadores gestionan sus horarios, clientes y planes de entrenamiento desde su móvil.',
  },
];

const plans = [
  {
    name: 'Básico',
    price: 49,
    features: ['1 ubicación', 'Hasta 200 miembros', 'Reservas online', 'Soporte por email'],
    popular: false,
  },
  {
    name: 'Pro',
    price: 99,
    features: ['5 ubicaciones', 'Miembros ilimitados', 'Pagos integrados', 'App para entrenadores', 'Reportes avanzados', 'Soporte prioritario'],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 199,
    features: ['Ubicaciones ilimitadas', 'Miembros ilimitados', 'API personalizada', 'Marca blanca', 'Account manager', 'SLA garantizado'],
    popular: false,
  },
];

const gyms = [
  { name: 'Wellness Gym Cabarete', location: 'República Dominicana', members: 450 },
  { name: 'FitZone Santo Domingo', location: 'República Dominicana', members: 1200 },
  { name: 'CrossFit Punta Cana', location: 'República Dominicana', members: 380 },
];

export function SaaSHome() {
  return (
    <main>
      {/* Hero */}
      <section className={styles.section} style={{
        paddingTop: 'var(--space-20)',
        paddingBottom: 'var(--space-20)',
        borderBottom: 'var(--border-width) solid var(--border-color)',
      }}>
        <div className={styles.container}>
          <div className={styles.content} style={{ textAlign: 'center' }}>
            <p className={styles.badge} style={{
              display: 'inline-flex',
              marginBottom: 'var(--space-6)',
            }}>
              Plataforma SaaS para Gimnasios
            </p>
            <img
              src="/logo.png"
              alt="GymFlow"
              style={{ height: '80px', marginBottom: 'var(--space-6)' }}
            />
            <p style={{
              fontSize: 'var(--text-xl)',
              color: 'var(--color-gray-600)',
              maxWidth: '600px',
              margin: '0 auto var(--space-8)',
            }}>
              El sistema completo para gestionar tu gimnasio. Reservas, pagos, membresías y más en una sola plataforma.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center' }}>
              <Link to="/register">
                <Button size="large">Comenzar Gratis</Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="large">Iniciar Sesión</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader} style={{ textAlign: 'center' }}>
            <h2>Todo lo que necesitas</h2>
            <p className={styles.sectionSubtitle}>
              Una solución completa para la gestión de gimnasios
            </p>
          </div>
          <div className={`${styles.grid} ${styles.grid2}`}>
            {features.map((feature) => (
              <div
                key={feature.title}
                className={styles.card}
                style={{ padding: 'var(--space-6)' }}
              >
                <h3 style={{ marginBottom: 'var(--space-3)' }}>{feature.title}</h3>
                <p className={styles.footerText}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className={styles.section} style={{ backgroundColor: 'var(--color-gray-100)' }}>
        <div className={styles.container}>
          <div className={styles.sectionHeader} style={{ textAlign: 'center' }}>
            <h2>Planes y Precios</h2>
            <p className={styles.sectionSubtitle}>
              Elige el plan perfecto para tu gimnasio
            </p>
          </div>
          <div className={`${styles.grid} ${styles.grid3}`}>
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={styles.card}
                style={{
                  padding: 'var(--space-6)',
                  position: 'relative',
                  border: plan.popular ? '2px solid var(--color-black)' : undefined,
                }}
              >
                {plan.popular && (
                  <span style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--color-black)',
                    color: 'var(--color-white)',
                    padding: 'var(--space-1) var(--space-3)',
                    fontSize: 'var(--text-xs)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    Popular
                  </span>
                )}
                <h3 style={{ marginBottom: 'var(--space-2)' }}>{plan.name}</h3>
                <p style={{ fontSize: 'var(--text-4xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-4)' }}>
                  ${plan.price}<span style={{ fontSize: 'var(--text-base)', fontWeight: 'normal', color: 'var(--color-gray-500)' }}>/mes</span>
                </p>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: 'var(--space-6)' }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ padding: 'var(--space-2) 0', borderBottom: 'var(--border-width) solid var(--border-color)', fontSize: 'var(--text-sm)' }}>
                      ✓ {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register">
                  <Button fullWidth variant={plan.popular ? 'primary' : 'secondary'}>
                    Elegir Plan
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Gyms */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader} style={{ textAlign: 'center' }}>
            <h2>Gimnasios que usan GymFlow</h2>
            <p className={styles.sectionSubtitle}>
              Más de 150 gimnasios confían en nosotros
            </p>
          </div>
          <div className={`${styles.grid} ${styles.grid3}`}>
            {gyms.map((gym) => (
              <div
                key={gym.name}
                className={styles.card}
                style={{ padding: 'var(--space-6)', textAlign: 'center' }}
              >
                <h3 style={{ marginBottom: 'var(--space-1)' }}>{gym.name}</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-500)', marginBottom: 'var(--space-2)' }}>{gym.location}</p>
                <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>{gym.members} miembros</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.section} style={{ backgroundColor: 'var(--color-black)', color: 'var(--color-white)' }}>
        <div className={styles.container}>
          <div className={styles.content} style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>
              ¿Listo para transformar tu gimnasio?
            </h2>
            <p style={{ marginBottom: 'var(--space-8)', opacity: 0.8 }}>
              Comienza tu prueba gratis de 14 días. Sin tarjeta de crédito.
            </p>
            <Link to="/register">
              <Button variant="secondary" size="large">
                Comenzar Ahora
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
