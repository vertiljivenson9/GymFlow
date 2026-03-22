import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/Button';
import styles from '@/styles/components.module.css';

interface Payment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  serviceName: string;
  amount: number;
  date: string;
  status: string;
}

interface User {
  uid: string;
  displayName: string;
  email: string;
  createdAt: string;
}

export function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'payments' | 'users'>('payments');

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/dashboard');
      return;
    }

    // Load mock data for demo
    const mockPayments: Payment[] = [
      { id: '1', userId: 'u1', userName: 'Juan Pérez', userEmail: 'juan@email.com', serviceName: 'Personal Training', amount: 50, date: '2024-03-20', status: 'completed' },
      { id: '2', userId: 'u2', userName: 'María García', userEmail: 'maria@email.com', serviceName: 'Boxing Class', amount: 40, date: '2024-03-19', status: 'completed' },
      { id: '3', userId: 'u3', userName: 'Carlos Rodríguez', userEmail: 'carlos@email.com', serviceName: 'Group Fitness', amount: 25, date: '2024-03-18', status: 'pending' },
    ];

    const mockUsers: User[] = [
      { uid: 'u1', displayName: 'Juan Pérez', email: 'juan@email.com', createdAt: '2024-03-15' },
      { uid: 'u2', displayName: 'María García', email: 'maria@email.com', createdAt: '2024-03-16' },
      { uid: 'u3', displayName: 'Carlos Rodríguez', email: 'carlos@email.com', createdAt: '2024-03-17' },
    ];

    const storedPayments = localStorage.getItem('wellness_payments');
    const storedUsers = localStorage.getItem('wellness_users');

    if (storedPayments) {
      try {
        const parsed = JSON.parse(storedPayments);
        setPayments([...mockPayments, ...parsed]);
      } catch (e) {
        setPayments(mockPayments);
      }
    } else {
      setPayments(mockPayments);
    }

    if (storedUsers) {
      try {
        const parsed = JSON.parse(storedUsers);
        setUsers([...mockUsers, ...parsed]);
      } catch (e) {
        setUsers(mockUsers);
      }
    } else {
      setUsers(mockUsers);
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  if (!user?.isAdmin) {
    return null;
  }

  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);

  return (
    <main className={styles.section}>
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-1)' }}>
              Panel de Administración
            </h1>
            <p style={{ color: 'var(--color-gray-600)' }}>Administra pagos y usuarios</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <Link to="/dashboard">
              <Button variant="secondary">Dashboard</Button>
            </Link>
            <Button variant="secondary" onClick={handleLogout}>Cerrar Sesión</Button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          <div className={styles.card} style={{ padding: 'var(--space-5)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)', marginBottom: 'var(--space-1)' }}>Ingresos Totales</p>
            <p style={{ fontSize: 'var(--text-3xl)', fontFamily: 'var(--font-display)', fontWeight: 'var(--font-bold)' }}>${totalRevenue} USD</p>
          </div>
          <div className={styles.card} style={{ padding: 'var(--space-5)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)', marginBottom: 'var(--space-1)' }}>Usuarios Registrados</p>
            <p style={{ fontSize: 'var(--text-3xl)', fontFamily: 'var(--font-display)', fontWeight: 'var(--font-bold)' }}>{users.length}</p>
          </div>
          <div className={styles.card} style={{ padding: 'var(--space-5)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)', marginBottom: 'var(--space-1)' }}>Pagos Completados</p>
            <p style={{ fontSize: 'var(--text-3xl)', fontFamily: 'var(--font-display)', fontWeight: 'var(--font-bold)' }}>{payments.filter(p => p.status === 'completed').length}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', borderBottom: 'var(--border-width) solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('payments')}
            style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'payments' ? '2px solid var(--color-black)' : 'none',
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              color: activeTab === 'payments' ? 'var(--color-black)' : 'var(--color-gray-500)',
            }}
          >
            Pagos
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'users' ? '2px solid var(--color-black)' : 'none',
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              color: activeTab === 'users' ? 'var(--color-black)' : 'var(--color-gray-500)',
            }}
          >
            Usuarios
          </button>
        </div>

        {activeTab === 'payments' && (
          <div className={styles.card} style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', textTransform: 'uppercase' }}>Usuario</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', textTransform: 'uppercase' }}>Servicio</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', textTransform: 'uppercase' }}>Monto</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', textTransform: 'uppercase' }}>Fecha</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', textTransform: 'uppercase' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} style={{ borderBottom: 'var(--border-width) solid var(--border-color)' }}>
                    <td style={{ padding: 'var(--space-3)' }}>
                      <div>
                        <p style={{ fontWeight: 'var(--font-medium)' }}>{payment.userName}</p>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-500)' }}>{payment.userEmail}</p>
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-3)' }}>{payment.serviceName}</td>
                    <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--font-bold)' }}>${payment.amount}</td>
                    <td style={{ padding: 'var(--space-3)', color: 'var(--color-gray-600)' }}>{payment.date}</td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      <span style={{
                        padding: 'var(--space-1) var(--space-2)',
                        fontSize: 'var(--text-xs)',
                        textTransform: 'uppercase',
                        backgroundColor: payment.status === 'completed' ? '#dcfce7' : '#fef3c7',
                        color: payment.status === 'completed' ? '#166534' : '#92400e',
                      }}>
                        {payment.status === 'completed' ? 'Completado' : 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'users' && (
          <div className={styles.card} style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', textTransform: 'uppercase' }}>Nombre</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', textTransform: 'uppercase' }}>Email</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', textTransform: 'uppercase' }}>Fecha Registro</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.uid} style={{ borderBottom: 'var(--border-width) solid var(--border-color)' }}>
                    <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--font-medium)' }}>{u.displayName}</td>
                    <td style={{ padding: 'var(--space-3)', color: 'var(--color-gray-600)' }}>{u.email}</td>
                    <td style={{ padding: 'var(--space-3)', color: 'var(--color-gray-600)' }}>{u.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
