import { Link } from 'react-router-dom';
import { useGym } from '@/lib/gym-context';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/Button';
import styles from '@/styles/components.module.css';

const trainers = [
  { name: 'Francis Javier', role: 'Profesor de Boxeo', image: '/trainer1.jpg' },
  { name: 'Entrenador', role: 'Fitness & Fuerza', image: '/trainer2.jpg' },
  { name: 'Genevieve', role: 'Entrenadora Personal', image: '/trainer3.png' },
];

export function GymHome() {
  const { gym } = useGym();
  const { isAuthenticated } = useAuth();

  if (!gym) {
    return (
      <main className={styles.section}>
        <div className={styles.container} style={{ textAlign: 'center' }}>
          <h1>Gimnasio no encontrado</h1>
          <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--space-6)' }}>
            Este gimnasio no existe o ha sido desactivado.
          </p>
          <Link to="/">
            <Button>Volver al inicio</Button>
          </Link>
        </div>
      </main>
    );
  }

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
              {gym.address}
            </p>
            <h1 style={{
              fontSize: 'var(--text-5xl)',
              marginBottom: 'var(--space-6)',
              letterSpacing: '-0.02em',
            }}>
              {gym.name}
            </h1>
            <p style={{
              fontSize: 'var(--text-xl)',
              color: 'var(--color-gray-600)',
              maxWidth: '480px',
              margin: '0 auto var(--space-8)',
            }}>
              {gym.description}
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center' }}>
              <Link to="/book">
                <Button size="large">Reservar Sesión</Button>
              </Link>
              {!isAuthenticated && (
                <Link to="/login">
                  <Button variant="secondary" size="large">Iniciar Sesión</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader} style={{ textAlign: 'center' }}>
            <h2>Nuestros Servicios</h2>
            <p className={styles.sectionSubtitle}>
              Entrenamientos personalizados para todos los niveles
            </p>
          </div>
          <div className={`${styles.grid} ${styles.grid3}`}>
            {['Personal Training', 'Clases Grupales', 'Wellness & Recuperación'].map((service) => (
              <div key={service} className={styles.card} style={{ padding: 'var(--space-6)' }}>
                <h3 style={{ marginBottom: 'var(--space-3)' }}>{service}</h3>
                <p className={styles.footerText}>
                  Sesiones profesionales con entrenadores certificados.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trainers */}
      <section className={styles.section} style={{ backgroundColor: 'var(--color-gray-100)' }}>
        <div className={styles.container}>
          <div className={styles.sectionHeader} style={{ textAlign: 'center' }}>
            <h2>Conoce a Nuestros Entrenadores</h2>
            <p className={styles.sectionSubtitle}>
              Profesionales certificados listos para ayudarte
            </p>
          </div>
          <div className={styles.trainersGrid}>
            {trainers.map((trainer) => (
              <div key={trainer.name} className={styles.trainerCard}>
                <div className={styles.trainerImageWrapper}>
                  <img
                    src={trainer.image}
                    alt={trainer.name}
                    className={styles.trainerImage}
                  />
                </div>
                <h3 className={styles.trainerName}>{trainer.name}</h3>
                <p className={styles.trainerRole}>{trainer.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.content} style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>
              ¿Listo para empezar?
            </h2>
            <p className={styles.sectionSubtitle} style={{ marginBottom: 'var(--space-8)' }}>
              Reserva tu primera sesión en menos de 2 minutos
            </p>
            <Link to="/book">
              <Button variant="accent" size="large">
                Reservar Ahora
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
