import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useGym } from '@/lib/gym-context';
import styles from '@/styles/components.module.css';

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const { gym, isMainSite } = useGym();

  const homeLink = gym ? `/${gym.slug}` : '/';

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.headerContent}>
          <Link to={homeLink} className={styles.logoLink}>
            <img
              src="/logo.png"
              alt="GymFlow"
              className={styles.logoImage}
            />
          </Link>
          <nav className={styles.nav}>
            {isMainSite ? (
              <>
                <Link to="/" className={styles.navLink}>Inicio</Link>
                <Link to="/features" className={styles.navLink}>Características</Link>
                <Link to="/pricing" className={styles.navLink}>Precios</Link>
                {isAuthenticated ? (
                  <>
                    {user?.role === 'super_admin' && (
                      <Link to="/admin" className={styles.navLink}>Admin</Link>
                    )}
                    <Link to="/dashboard" className={styles.navLink}>Dashboard</Link>
                    <button
                      onClick={logout}
                      className={styles.navButton}
                    >
                      Salir
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className={styles.navLink}>Login</Link>
                    <Link to="/register" className={styles.navLink}>Registro</Link>
                  </>
                )}
              </>
            ) : (
              <>
                <Link to={homeLink} className={styles.navLink}>Inicio</Link>
                <Link to="/book" className={styles.navLink}>Reservar</Link>
                {isAuthenticated ? (
                  <>
                    <Link to="/dashboard" className={styles.navLink}>Dashboard</Link>
                    <button
                      onClick={logout}
                      className={styles.navButton}
                    >
                      Salir
                    </button>
                  </>
                ) : (
                  <Link to="/login" className={styles.navLink}>Login</Link>
                )}
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
