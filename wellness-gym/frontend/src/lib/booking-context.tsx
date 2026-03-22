import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type {
  Service,
  TimeSlot,
  BookingStep,
  BookingState
} from '@/types';

type BookingAction =
  | { type: 'SET_STEP'; step: BookingStep }
  | { type: 'SELECT_SERVICE'; service: Service }
  | { type: 'SELECT_DATE'; date: string }
  | { type: 'SELECT_TIME'; timeSlot: TimeSlot }
  | { type: 'SET_CUSTOMER_DETAILS'; details: { name: string; email: string; phone: string } }
  | { type: 'SET_BOOKING_ID'; bookingId: string }
  | { type: 'SET_PAYMENT_STATUS'; status: 'idle' | 'processing' | 'success' | 'failed' | 'skipped' }
  | { type: 'RESET' };

const initialState: BookingState = {
  step: 'service',
  selectedService: null,
  selectedDate: null,
  selectedTimeSlot: null,
  customerDetails: {
    name: '',
    email: '',
    phone: '',
  },
  bookingId: null,
  paymentStatus: 'idle',
};

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step };
    case 'SELECT_SERVICE':
      return {
        ...state,
        selectedService: action.service,
        selectedDate: null,
        selectedTimeSlot: null,
      };
    case 'SELECT_DATE':
      return { ...state, selectedDate: action.date, selectedTimeSlot: null };
    case 'SELECT_TIME':
      return { ...state, selectedTimeSlot: action.timeSlot };
    case 'SET_CUSTOMER_DETAILS':
      return { ...state, customerDetails: action.details };
    case 'SET_BOOKING_ID':
      return { ...state, bookingId: action.bookingId };
    case 'SET_PAYMENT_STATUS':
      return { ...state, paymentStatus: action.status };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface BookingContextValue {
  state: BookingState;
  dispatch: React.Dispatch<BookingAction>;
  nextStep: () => void;
  prevStep: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

const stepOrder: BookingStep[] = ['service', 'time', 'details', 'payment', 'success'];

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  const nextStep = () => {
    const currentIndex = stepOrder.indexOf(state.step);
    if (currentIndex < stepOrder.length - 1) {
      dispatch({ type: 'SET_STEP', step: stepOrder[currentIndex + 1] });
    }
  };

  const prevStep = () => {
    const currentIndex = stepOrder.indexOf(state.step);
    if (currentIndex > 0) {
      dispatch({ type: 'SET_STEP', step: stepOrder[currentIndex - 1] });
    }
  };

  return (
    <BookingContext.Provider value={{ state, dispatch, nextStep, prevStep }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return context;
}
