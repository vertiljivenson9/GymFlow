import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import styles from '@/styles/components.module.css';

const features = [
  {
    title: 'Personal Training',
    description: 'One-on-one sessions with certified trainers who understand your fitness goals and create personalized workout plans.',
  },
  {
    title: 'Group Classes',
    description: 'Join our high-energy classes from yoga at sunrise to strength training. All levels welcome.',
  },
  {
    title: 'Wellness Recovery',
    description: 'Sauna, cold plunge, and massage therapy to recover faster and feel your best.',
  },
];

const trainers = [
  {
    name: 'Francis Javier',
    role: 'Profesor de Boxeo',
    image: '/trainer1.jpg',
    description: 'Experto en boxeo y acondicionamiento físico con años de experiencia entrenando campeones.',
  },
  {
    name: 'Entrenador',
    role: 'Fitness & Fuerza',
    image: '/trainer2.jpg',
    description: 'Especialista en entrenamiento de fuerza y hipertrofia para todos los niveles.',
  },
  {
    name: 'Genevieve',
    role: 'Entrenadora Personal',
    image: '/trainer3.png',
    description: 'Certificada en entrenamiento funcional y wellness para transformar tu cuerpo y mente.',
  },
];

export function Landing() {
  return (
    <main>
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
              Cabarete, Dominican Republic
            </p>
            <h1 style={{ 
              fontSize: 'var(--text-5xl)', 
              marginBottom: 'var(--space-6)',
              letterSpacing: '-0.02em',
            }}>
              Train in Paradise
            </h1>
            <p style={{ 
              fontSize: 'var(--text-xl)', 
              color: 'var(--color-gray-600)',
              maxWidth: '480px',
              margin: '0 auto var(--space-8)',
            }}>
              Premium fitness experience where wellness meets the Caribbean. 
              Book your session today.
            </p>
            <Link to="/book">
              <Button size="large">Book a Session</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>Lo Que Ofrecemos</h2>
            <p className={styles.sectionSubtitle}>
              Todo lo que necesitas para tu viaje fitness
            </p>
          </div>
          <div className={`${styles.grid} ${styles.grid3}`}>
            {features.map((feature) => (
              <div
                key={feature.title}
                className={styles.card}
                style={{ padding: 'var(--space-6)' }}
              >
                <h3 style={{ marginBottom: 'var(--space-3)' }}>
                  {feature.title}
                </h3>
                <p className={styles.footerText}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
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
                <p className={styles.trainerDescription}>{trainer.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className={styles.section}
        style={{ backgroundColor: 'var(--color-gray-100)' }}
      >
        <div className={styles.container}>
          <div className={styles.content} style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>
              Ready to Start?
            </h2>
            <p className={styles.sectionSubtitle} style={{ marginBottom: 'var(--space-8)' }}>
              Book your first session in under 2 minutes
            </p>
            <Link to="/book">
              <Button variant="accent" size="large">
                Book Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
