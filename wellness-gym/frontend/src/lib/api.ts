import type { 
  Service, 
  Availability, 
  Booking, 
  BookingRequest, 
  PaymentRequest, 
  PaymentResponse,
  ApiResponse 
} from '@/types';

const API_BASE = '/api';

async function request<T>(
  path: string, 
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { 
        success: false, 
        error: data.error || 'Request failed' 
      };
    }

    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    };
  }
}

export async function getServices(): Promise<ApiResponse<Service[]>> {
  return request<Service[]>('/services');
}

export async function getAvailability(
  serviceId: string, 
  startDate: string
): Promise<ApiResponse<Availability[]>> {
  const params = new URLSearchParams({ serviceId, startDate });
  return request<Availability[]>(`/availability?${params}`);
}

export async function createBooking(
  booking: BookingRequest
): Promise<ApiResponse<Booking>> {
  return request<Booking>('/create-booking', {
    method: 'POST',
    body: JSON.stringify(booking),
  });
}

export async function createPayment(
  payment: PaymentRequest
): Promise<ApiResponse<PaymentResponse>> {
  return request<PaymentResponse>('/create-payment', {
    method: 'POST',
    body: JSON.stringify(payment),
  });
}

export async function getBooking(id: string): Promise<ApiResponse<Booking>> {
  return request<Booking>(`/bookings/${id}`);
}
