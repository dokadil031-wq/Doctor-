export type Page = 'home' | 'doctors' | 'booking' | 'confirm' | 'profile' | 'register' | 'tickets' | 'login' | 'signup' | 'support' | 'dashboard';
export type GoToType = (page: Page, isBack?: boolean) => void;

export interface BookingInfo {
  id: string;
  token: string;
  patientName: string;
  phone?: string;
  doctorId: string;
  date: string;
  rawDate?: string;
  timeSlot: string;
  createdAt?: number;
}
