import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/Button';
import styles from '@/styles/components.module.css';

interface GymStats {
  id: string;
  name: string;
  slug: string;
  plan: string;
  members: number;
  revenue: number;
  status: string;
  createdAt: string;
}

export function SuperAdmin() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'gyms' | 'users' | 'revenue' | 'settings'>('gyms');
  const [gyms, setGyms] = useState<GymStats[]>([]);

  useEffect(() => {
    // Demo data
    setGyms([
      { id: '1', name: 'Wellness Gym Cabarete', slug: 'wellness-gym', plan: 'pro', members: 450, revenue: 4500, status: 'active', createdAt: '2024-01-15' },
      { id: '2', name: 'FitZone Santo Domingo', slug: 'fitzone', plan: 'enterprise', members: 1200, revenue: 12000, status: 'active', createdAt: '2024-02-20' },
      { id: '3', name: 'CrossFit Punta Cana', slug: 'crossfit-punta-cana', plan: 'basic', members: 380, revenue: 1900, status: 'active', createdAt: '2024-03-01' },
      { id: '4', name: 'Power Gym Santiago', slug: 'power-gym-santiago', plan: 'pro', members: 650, revenue: 6500, status: 'active', createdAt: '2024-03-10' },
    ]);
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const totalRevenue = gyms.reduce((sum, g) => sum + g.revenue, 0);
  const totalMembers = gyms.reduce((sum, g) => sum + g.members, 0);

  return (
    <main className={styles.section}>
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-1)' }}>
              GymFlow Admin
            </h1>
            <p style={{ color: 'var(--color-gray-600)' }}>Panel de Super Administrador</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <Button variant="secondary" onClick={handleLogout}>Cerrar Sesión</Button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          <div className={styles.card} style={{ padding: 'var(--space-5)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)', marginBottom: 'var(--space-1)' }}>Gimnasios Activos</p>
            <p style={{ fontSize: 'var(--text-3xl)', fontFamily: 'var(--font-display)', fontWeight: 'var(--font-bold)' }}>{gyms.length}</p>
          </div>
          <div className={styles.card} style={{ padding: 'var(--space-5)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)', marginBottom: 'var(--space-1)' }}>Miembros Totales</p>
            <p style={{ fontSize: 'var(--text-3xl)', fontFamily: 'var(--font-display)', fontWeight: 'var(--font-bold)' }}>{totalMembers.toLocaleString()}</p>
          </div>
          <div className={styles.card} style={{ padding: 'var(--space-5)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)', marginBottom: 'var(--space-1)' }}>Ingresos Mensuales</p>
            <p style={{ fontSize: 'var(--text-3xl)', fontFamily: 'var(--font-display)', fontWeight: 'var(--font-bold)' }}>${totalRevenue.toLocaleString()}</p>
          </div>
          <div className={styles.card} style={{ padding: 'var(--space-5)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)', marginBottom: 'var(--space-1)' }}>Conversión Trial</p>
            <p style={{ fontSize: 'var(--text-3xl)', fontFamily: 'var(--font-display)', fontWeight: 'var(--font-bold)' }}>78%</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', borderBottom: 'var(--border-width) solid var(--border-color)' }}>
          {(['gyms', 'users', 'revenue', 'settings'] as const).map((tab) => (
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
              {tab === 'gyms' ? 'Gimnasios' : tab === 'users' ? 'Usuarios' : tab === 'revenue' ? 'Ingresos' : 'Configuración'}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'gyms' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <h2>Gimnasios Registrados</h2>
              <Button>+ Agregar Gimnasio</Button>
            </div>
            <div className={styles.card} style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', textTransform: 'uppercase' }}>Nombre</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', textTransform: 'uppercase' }}>Plan</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', textTransform: 'uppercase' }}>Miembros</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', textTransform: 'uppercase' }}>Ingresos</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', textTransform: 'uppercase' }}>Estado</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', textTransform: 'uppercase' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {gyms.map((gym) => (
                    <tr key={gym.id} style={{ borderBottom: 'var(--border-width) solid var(--border-color)' }}>
                      <td style={{ padding: 'var(--space-3)' }}>
                        <div>
                          <p style={{ fontWeight: 'var(--font-medium)' }}>{gym.name}</p>
                          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-500)' }}>/{gym.slug}</p>
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-3)' }}>
                        <span style={{
                          padding: 'var(--space-1) var(--space-2)',
                          fontSize: 'var(--text-xs)',
                          textTransform: 'uppercase',
                          backgroundColor: gym.plan === 'enterprise' ? '#dcfce7' : gym.plan === 'pro' ? '#dbeafe' : '#f3f4f6',
                          color: gym.plan === 'enterprise' ? '#166534' : gym.plan === 'pro' ? '#1e40af' : '#374151',
                        }}>
                          {gym.plan}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-3)' }}>{gym.members}</td>
                      <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--font-medium)' }}>${gym.revenue.toLocaleString()}</td>
                      <td style={{ padding: 'var(--space-3)' }}>
                        <span style={{ color: 'var(--color-success)' }}>● Activo</span>
                      </td>
                      <td style={{ padding: 'var(--space-3)' }}>
                        <Link to={`/${gym.slug}`} style={{ color: 'var(--color-accent)', fontSize: 'var(--text-sm)' }}>
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div>
            <h2 style={{ marginBottom: 'var(--space-6)' }}>Reporte de Ingresos</h2>
            <div className={styles.card} style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
              <p style={{ color: 'var(--color-gray-600)' }}>Gráficos de ingresos próximamente</p>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h2 style={{ marginBottom: 'var(--space-6)' }}>Usuarios del Sistema</h2>
            <div className={styles.card} style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
              <p style={{ color: 'var(--color-gray-600)' }}>Lista de usuarios próximamente</p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h2 style={{ marginBottom: 'var(--space-6)' }}>Configuración Global</h2>
            <div className={styles.card} style={{ padding: 'var(--space-6)' }}>
              <h3 style={{ marginBottom: 'var(--space-4)' }}>Planes y Precios</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
                <div style={{ padding: 'var(--space-4)', border: 'var(--border-width) solid var(--border-color)' }}>
                  <p style={{ fontWeight: 'var(--font-medium)' }}>Básico</p>
                  <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>$49/mes</p>
                </div>
                <div style={{ padding: 'var(--space-4)', border: 'var(--border-width) solid var(--border-color)' }}>
                  <p style={{ fontWeight: 'var(--font-medium)' }}>Pro</p>
                  <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>$99/mes</p>
                </div>
                <div style={{ padding: 'var(--space-4)', border: 'var(--border-width) solid var(--border-color)' }}>
                  <p style={{ fontWeight: 'var(--font-medium)' }}>Enterprise</p>
                  <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>$199/mes</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
