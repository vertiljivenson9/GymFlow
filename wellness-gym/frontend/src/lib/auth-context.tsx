import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  gymSlug: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [gymSlug, setGymSlug] = useState<string | null>(null);

  useEffect(() => {
    // Get gym slug from URL path
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    if (parts[0] && parts[0] !== 'admin' && parts[0] !== 'login' && parts[0] !== 'register' && parts[0] !== 'gym') {
      setGymSlug(parts[0]);
    }

    // Check for stored session
    const stored = localStorage.getItem('gymflow_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem('gymflow_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, gymSlug }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        return { success: false, error: data.error || 'Error al iniciar sesión' };
      }

      setUser(data.user);
      localStorage.setItem('gymflow_user', JSON.stringify(data.user));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName, gymSlug }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        return { success: false, error: data.error || 'Error al registrarse' };
      }

      setUser(data.user);
      localStorage.setItem('gymflow_user', JSON.stringify(data.user));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gymflow_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      gymSlug,
      login,
      register,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
