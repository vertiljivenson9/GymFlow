import { Link } from 'react-router-dom';
import { useGym } from '@/lib/gym-context';
import styles from '@/styles/components.module.css';

export function Footer() {
  const { gym, isMainSite } = useGym();
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerContent}>
          <div>
            <Link to="/" className={styles.footerLogo}>
              <img
                src="/logo.png"
                alt="GymFlow"
                className={styles.footerLogoImage}
              />
            </Link>
            <p className={styles.footerText} style={{ marginTop: 'var(--space-4)' }}>
              {gym
                ? gym.description
                : 'Gestión Integral de Gimnasios'}
            </p>
          </div>
          <div>
            <p className={styles.footerHeading}>Plataforma</p>
            <div className={styles.footerLinks}>
              <Link to="/features" className={styles.footerLink}>Características</Link>
              <Link to="/pricing" className={styles.footerLink}>Precios</Link>
              <Link to="/login" className={styles.footerLink}>Login</Link>
              <Link to="/register" className={styles.footerLink}>Registro</Link>
            </div>
          </div>
          <div>
            <p className={styles.footerHeading}>Contacto</p>
            <div className={styles.footerLinks}>
              {gym ? (
                <>
                  <span className={styles.footerLink}>{gym.email}</span>
                  <span className={styles.footerLink}>{gym.phone}</span>
                  <span className={styles.footerLink}>{gym.address}</span>
                </>
              ) : (
                <>
                  <span className={styles.footerLink}>contacto@gymflow.com</span>
                  <span className={styles.footerLink}>República Dominicana</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 'var(--space-8)', paddingTop: 'var(--space-4)', borderTop: 'var(--border-width) solid var(--border-color)', textAlign: 'center' }}>
          <p className={styles.footerText}>
            © {currentYear} GymFlow. Gestión Integral de Gimnasios. EST. MMXV
          </p>
        </div>
      </div>
    </footer>
  );
}
