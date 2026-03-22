import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { FirebaseClient } from './firebase';

interface Env {
  FIREBASE_PROJECT_ID: string;
  CACHE: KVNamespace;
}

type ServiceData = {
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  active: boolean;
  gymId: string;
};

type BookingData = {
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  timeSlotId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  price: number;
  status: string;
  gymId: string;
  customerId: string;
  createdAt: string;
};

type UserData = {
  email: string;
  displayName: string;
  role: 'super_admin' | 'gym_admin' | 'trainer' | 'member';
  gymId?: string;
  createdAt: string;
};

type GymData = {
  slug: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  plan: string;
  active: boolean;
  createdAt: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function generateTimeSlots(date: string): Array<{ id: string; startTime: string; endTime: string; available: boolean }> {
  const slots = [];
  const startHour = 6;
  const endHour = 20;

  for (let hour = startHour; hour < endHour; hour += 2) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 2).toString().padStart(2, '0')}:00`;

    slots.push({
      id: `${date}-${startTime}`,
      startTime,
      endTime,
      available: Math.random() > 0.3,
    });
  }

  return slots;
}

// Demo gyms for multi-tenant
const DEMO_GYMS: Record<string, GymData> = {
  'wellness-gym': {
    slug: 'wellness-gym',
    name: 'Wellness Gym Cabarete',
    description: 'Premium fitness experience in Cabarete, Dominican Republic',
    address: 'Calle Principal, Cabarete, RD',
    phone: '+1 809 123 4567',
    email: 'info@wellnessgym.com',
    plan: 'pro',
    active: true,
    createdAt: '2024-01-01',
  },
  'fitzone': {
    slug: 'fitzone',
    name: 'FitZone Santo Domingo',
    description: 'Modern fitness center in the heart of Santo Domingo',
    address: 'Av. Winston Churchill, SD',
    phone: '+1 809 555 1234',
    email: 'info@fitzone.com',
    plan: 'basic',
    active: true,
    createdAt: '2024-02-15',
  },
};

// Demo admin users
const DEMO_USERS: Record<string, UserData & { password: string }> = {
  'admin@gymflow.com': {
    email: 'admin@gymflow.com',
    displayName: 'Admin',
    role: 'super_admin',
    password: 'admin123',
    createdAt: '2024-01-01',
  },
  'wellnessgymcabarete@gmail.com': {
    email: 'wellnessgymcabarete@gmail.com',
    displayName: 'Wellness Gym Admin',
    role: 'gym_admin',
    gymId: 'wellness-gym',
    password: 'admin123',
    createdAt: '2024-01-01',
  },
};

// GET /api/gym/:slug
app.get('/api/gym/:slug', async (c) => {
  const slug = c.req.param('slug');
  const demoGym = DEMO_GYMS[slug];

  if (demoGym) {
    return c.json({ success: true, gym: { id: slug, ...demoGym } });
  }

  const db = new FirebaseClient({ projectId: c.env.FIREBASE_PROJECT_ID });
  try {
    const gyms = await db.getCollection<GymData>('gyms');
    const gym = gyms.find(g => g.slug === slug && g.active);
    if (gym) {
      return c.json({ success: true, gym: { id: slug, ...gym } });
    }
  } catch (e) { }

  return c.json({ success: false, error: 'Gym not found' }, 404);
});

// GET /api/services
app.get('/api/services', async (c) => {
  const gymSlug = c.req.query('gymId');
  const db = new FirebaseClient({ projectId: c.env.FIREBASE_PROJECT_ID });

  try {
    const services = await db.getCollection<ServiceData>('services');
    const filtered = gymSlug ? services.filter(s => s.gymId === gymSlug && s.active) : services.filter(s => s.active);
    return c.json({ success: true, data: filtered });
  } catch {
    const fallbackServices = [
      { id: 'pt-001', name: 'Personal Training', description: 'One-on-one session with a certified trainer.', duration: 60, price: 75, category: 'training', active: true, gymId: gymSlug || 'default' },
      { id: 'gc-001', name: 'Group Strength', description: 'High-energy group workout.', duration: 45, price: 25, category: 'class', active: true, gymId: gymSlug || 'default' },
      { id: 'yw-001', name: 'Sunrise Yoga', description: 'Peaceful yoga session.', duration: 60, price: 20, category: 'wellness', active: true, gymId: gymSlug || 'default' },
      { id: 'bx-001', name: 'Boxing Class', description: 'Learn boxing techniques.', duration: 60, price: 40, category: 'training', active: true, gymId: gymSlug || 'default' },
    ];
    return c.json({ success: true, data: fallbackServices });
  }
});

// GET /api/availability
app.get('/api/availability', async (c) => {
  const serviceId = c.req.query('serviceId');
  const startDate = c.req.query('startDate');

  if (!serviceId || !startDate) {
    return c.json({ success: false, error: 'Missing serviceId or startDate' }, 400);
  }

  const availability = [];
  const start = new Date(startDate);

  for (let i = 0; i < 14; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    availability.push({
      date: dateStr,
      slots: generateTimeSlots(dateStr),
    });
  }

  return c.json({ success: true, data: availability });
});

// POST /api/auth/register
app.post('/api/auth/register', async (c) => {
  const db = new FirebaseClient({ projectId: c.env.FIREBASE_PROJECT_ID });

  try {
    const body = await c.req.json<{
      email: string;
      password: string;
      displayName: string;
      gymSlug?: string;
    }>();

    const { email, password, displayName, gymSlug } = body;

    if (!email || !password || !displayName) {
      return c.json({ success: false, error: 'Todos los campos son requeridos' }, 400);
    }

    if (password.length < 6) {
      return c.json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres' }, 400);
    }

    const uid = generateId();
    const userData: UserData = {
      email: email.toLowerCase(),
      displayName,
      role: 'member',
      gymId: gymSlug,
      createdAt: new Date().toISOString(),
    };

    await db.createDocument('users', userData, uid);

    return c.json({
      success: true,
      user: {
        uid,
        ...userData,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    return c.json({ success: false, error: message }, 500);
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (c) => {
  const db = new FirebaseClient({ projectId: c.env.FIREBASE_PROJECT_ID });

  try {
    const body = await c.req.json<{
      email: string;
      password: string;
      gymSlug?: string;
    }>();

    const { email, password } = body;

    if (!email || !password) {
      return c.json({ success: false, error: 'Email y contraseña requeridos' }, 400);
    }

    const emailLower = email.toLowerCase();

    // Check demo users first
    const demoUser = DEMO_USERS[emailLower];
    if (demoUser && demoUser.password === password) {
      const uid = `demo_${emailLower.replace(/[@.]/g, '_')}`;
      return c.json({
        success: true,
        user: {
          uid,
          email: demoUser.email,
          displayName: demoUser.displayName,
          role: demoUser.role,
          gymId: demoUser.gymId,
        },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ success: false, error: 'Formato de email inválido' }, 400);
    }

    if (password.length < 6) {
      return c.json({ success: false, error: 'Credenciales inválidas' }, 401);
    }

    // For demo, accept any valid email with password >= 6 chars
    const uid = generateId();
    const displayName = email.split('@')[0];

    return c.json({
      success: true,
      user: {
        uid,
        email: emailLower,
        displayName,
        role: 'member',
        gymId: body.gymSlug,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return c.json({ success: false, error: message }, 500);
  }
});

// POST /api/create-booking
app.post('/api/create-booking', async (c) => {
  const db = new FirebaseClient({ projectId: c.env.FIREBASE_PROJECT_ID });

  try {
    const body = await c.req.json<{
      serviceId: string;
      date: string;
      timeSlotId: string;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      gymId?: string;
      customerId?: string;
    }>();

    const { serviceId, date, timeSlotId, customerName, customerEmail, customerPhone, gymId, customerId } = body;

    if (!serviceId || !date || !timeSlotId || !customerName || !customerEmail || !customerPhone) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }

    let service: ServiceData & { id: string } | null = null;
    try {
      service = await db.getDocument<ServiceData>('services', serviceId);
    } catch {
      // Fallback
    }

    const serviceName = service?.name || 'Personal Training';
    const price = service?.price || 75;

    const timeParts = timeSlotId.split('-');
    const time = timeParts.length >= 3 ? `${timeParts[2]}:00` : '10:00';

    const bookingId = generateId();
    const bookingData: BookingData = {
      serviceId,
      serviceName,
      date,
      time,
      timeSlotId,
      customerName,
      customerEmail,
      customerPhone,
      price,
      status: 'pending',
      gymId: gymId || 'default',
      customerId: customerId || 'guest',
      createdAt: new Date().toISOString(),
    };

    await db.createDocument('bookings', bookingData, bookingId);

    return c.json({
      success: true,
      data: {
        id: bookingId,
        ...bookingData,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create booking';
    return c.json({ success: false, error: message }, 500);
  }
});

// POST /api/create-payment
app.post('/api/create-payment', async (c) => {
  const db = new FirebaseClient({ projectId: c.env.FIREBASE_PROJECT_ID });

  try {
    const body = await c.req.json<{
      bookingId: string;
      amount: number;
      currency: string;
      paymentMethod: string;
    }>();

    const { bookingId, amount, currency } = body;

    if (!bookingId || !amount) {
      return c.json({ success: false, error: 'Missing bookingId or amount' }, 400);
    }

    const paymentId = `pay_${generateId()}`;

    await db.createDocument('payments', {
      bookingId,
      amount,
      currency: currency || 'USD',
      status: 'succeeded',
      createdAt: new Date().toISOString(),
    }, paymentId);

    try {
      await db.updateDocument<BookingData>('bookings', bookingId, {
        status: 'confirmed',
        paid: true,
        paymentId,
      });
    } catch {
      // Continue even if update fails
    }

    return c.json({
      success: true,
      data: {
        paymentId,
        clientSecret: `${paymentId}_secret`,
        status: 'succeeded',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment processing failed';
    return c.json({ success: false, error: message }, 500);
  }
});

// GET /api/bookings/:id
app.get('/api/bookings/:id', async (c) => {
  const db = new FirebaseClient({ projectId: c.env.FIREBASE_PROJECT_ID });
  const bookingId = c.req.param('id');

  try {
    const booking = await db.getDocument<BookingData>('bookings', bookingId);

    if (!booking) {
      return c.json({ success: false, error: 'Booking not found' }, 404);
    }

    return c.json({ success: true, data: booking });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch booking';
    return c.json({ success: false, error: message }, 500);
  }
});

export default app;
