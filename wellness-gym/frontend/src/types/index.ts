// SaaS Multi-tenant Types

export interface Gym {
  id: string;
  slug: string;
  name: string;
  description: string;
  logo?: string;
  primaryColor: string;
  address: string;
  phone: string;
  email: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  active: boolean;
  createdAt: string;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'gym_admin' | 'trainer' | 'member';
  gymId?: string;
  createdAt: string;
}

export interface Service {
  id: string;
  gymId: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: 'training' | 'class' | 'wellness';
  active: boolean;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface Availability {
  date: string;
  slots: TimeSlot[];
}

export interface Booking {
  id: string;
  gymId: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paid: boolean;
  paymentId?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  gymId: string;
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
}

export interface Subscription {
  id: string;
  gymId: string;
  plan: 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due';
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

// API Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type BookingStep = 'service' | 'time' | 'details' | 'payment' | 'success';

export interface BookingState {
  step: BookingStep;
  selectedService: Service | null;
  selectedDate: string | null;
  selectedTimeSlot: TimeSlot | null;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
  };
  bookingId: string | null;
  paymentStatus: 'idle' | 'processing' | 'success' | 'failed' | 'skipped';
}

// Gym context for multi-tenant
export interface GymContext {
  gym: Gym | null;
  loading: boolean;
  error: string | null;
}
