export interface Service {
  id: string;
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
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  timeSlotId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentId?: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  createdAt: string;
}
