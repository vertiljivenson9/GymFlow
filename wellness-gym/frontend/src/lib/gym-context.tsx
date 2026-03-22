import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Gym } from '@/types';

interface GymContextType {
  gym: Gym | null;
  loading: boolean;
  error: string | null;
  isMainSite: boolean;
}

const GymContext = createContext<GymContextType | null>(null);

// Demo gyms for the SaaS
const DEMO_GYMS: Record<string, Gym> = {
  'wellness-gym': {
    id: 'gym_1',
    slug: 'wellness-gym',
    name: 'Wellness Gym Cabarete',
    description: 'Premium fitness experience in Cabarete, Dominican Republic',
    primaryColor: '#000000',
    address: 'Calle Principal, Cabarete, RD',
    phone: '+1 809 123 4567',
    email: 'info@wellnessgym.com',
    plan: 'pro',
    active: true,
    createdAt: '2024-01-01',
  },
  'fitzone': {
    id: 'gym_2',
    slug: 'fitzone',
    name: 'FitZone Santo Domingo',
    description: 'Modern fitness center in the heart of Santo Domingo',
    primaryColor: '#2563eb',
    address: 'Av. Winston Churchill, SD',
    phone: '+1 809 555 1234',
    email: 'info@fitzone.com',
    plan: 'basic',
    active: true,
    createdAt: '2024-02-15',
  },
};

export function GymProvider({ children }: { children: ReactNode }) {
  const [gym, setGym] = useState<Gym | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detectGym = async () => {
      const path = window.location.pathname;
      const parts = path.split('/').filter(Boolean);

      // Check if we're on the main SaaS site or a gym subdomain
      const firstPart = parts[0];

      // Main site routes
      const mainRoutes = ['', 'admin', 'login', 'register', 'gym', 'pricing', 'features'];
      const isMainSite = mainRoutes.includes(firstPart) || !firstPart;

      if (isMainSite) {
        setGym(null);
        setLoading(false);
        return;
      }

      // Try to load gym by slug
      const demoGym = DEMO_GYMS[firstPart];
      if (demoGym) {
        setGym(demoGym);
        setLoading(false);
        return;
      }

      // Try API
      try {
        const response = await fetch(`/api/gym/${firstPart}`);
        const data = await response.json();
        if (data.success && data.gym) {
          setGym(data.gym);
        } else {
          setError('Gimnasio no encontrado');
        }
      } catch (e) {
        setError('Error cargando gimnasio');
      }

      setLoading(false);
    };

    detectGym();
  }, []);

  const isMainSite = !gym && !loading;

  return (
    <GymContext.Provider value={{ gym, loading, error, isMainSite }}>
      {children}
    </GymContext.Provider>
  );
}

export function useGym() {
  const context = useContext(GymContext);
  if (!context) {
    throw new Error('useGym must be used within GymProvider');
  }
  return context;
}
