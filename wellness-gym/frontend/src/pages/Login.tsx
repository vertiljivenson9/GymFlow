import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useGym } from '@/lib/gym-context';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import styles from '@/styles/components.module.css';

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register, isAuthenticated, user } = useAuth();
  const { gym, isMainSite } = useGym();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const from = (location.state as any)?.from?.pathname;
      if (from) {
        navigate(from);
      } else if (user.role === 'super_admin') {
        navigate('/admin');
      } else if (user.role === 'gym_admin') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const result = await login(email, password);
        if (result.success) {
          // Navigation handled by useEffect
        } else {
          setError(result.error || 'Error al iniciar sesión');
        }
      } else {
        if (!displayName.trim()) {
          setError('El nombre es requerido');
          setLoading(false);
          return;
        }
        const result = await register(email, password, displayName);
        if (result.success) {
          // Navigation handled by useEffect
        } else {
          setError(result.error || 'Error al registrarse');
        }
      }
    } catch (err) {
      setError('Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.section} style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div className={styles.container} style={{ maxWidth: '420px' }}>
        <div className={styles.card} style={{ padding: 'var(--space-8)' }}>
          {/* Logo / Brand */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <Link to="/" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', fontFamily: 'var(--font-display)' }}>
              {gym ? gym.name : 'GymFlow'}
            </Link>
            {gym && (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-500)', marginTop: 'var(--space-1)' }}>
                Plataforma de reservas
              </p>
            )}
          </div>

          <h1 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)', textAlign: 'center' }}>
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h1>
          <p style={{ textAlign: 'center', color: 'var(--color-gray-600)', marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
            {isLogin
              ? 'Ingresa para reservar y gestionar tu cuenta'
              : 'Regístrate para comenzar'
            }
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            {!isLogin && (
              <Input
                label="Nombre Completo"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tu nombre"
                required
              />
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {error && (
              <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} style={{ width: '100%' }} size="large">
              {loading ? 'Cargando...' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </Button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
            {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-accent)',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {isLogin ? 'Registrarse' : 'Iniciar Sesión'}
            </button>
          </p>

          <p style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
            <Link to="/" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)' }}>
              ← Volver al inicio
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
