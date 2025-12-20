// Types (using const objects instead of enums for better compatibility)
export const StationType = {
  XE_MAY: 'xe_may',
  OTO: 'oto',
  CA_HAI: 'ca_hai'
} as const;
export type StationType = typeof StationType[keyof typeof StationType];

export const VehicleType = {
  XE_MAY_USB: 'xe_may_usb',
  XE_MAY_CCS: 'xe_may_ccs',
  OTO_CCS: 'oto_ccs'
} as const;
export type VehicleType = typeof VehicleType[keyof typeof VehicleType];

export const StationStatus = {
  ACTIVE: 'active',
  MAINTENANCE: 'maintenance',
  INACTIVE: 'inactive'
} as const;
export type StationStatus = typeof StationStatus[keyof typeof StationStatus];

export const BookingStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CHARGING: 'charging',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;
export type BookingStatus = typeof BookingStatus[keyof typeof BookingStatus];

export const PaymentStatus = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed'
} as const;
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export const PaymentMethod = {
  QR: 'QR',
  BANK: 'Bank'
} as const;
export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

// Interfaces
export interface User {
  user_id: number;
  email: string;
  full_name: string;
  phone?: string;
  avatar?: string;
  role_id: number;
  created_at: string;
}

export interface Station {
  station_id: number;
  station_name: string;
  address: string;
  latitude: number;
  longitude: number;
  station_type: StationType;
  price_per_kwh: number;
  charging_power: number;
  connector_types: string;
  opening_hours: string;
  contact_phone: string;
  available_slots: number;
  total_slots: number;
  status: StationStatus;
  avatar_url: string;
  created_at: string;
}

export interface Booking {
  booking_id: number;
  user_id: number;
  station_id: number;
  vehicle_type: VehicleType;
  start_time: string;
  end_time: string;
  actual_start?: string;
  actual_end?: string;
  total_cost: number;
  status: BookingStatus;
  promotion_code?: string;
  created_at: string;
}

export interface ChargingSession {
  session_id: number;
  booking_id: number;
  start_battery_percent: number;
  end_battery_percent: number;
  energy_consumed: number;
  created_at: string;
}

export interface Payment {
  payment_id: number;
  booking_id: number;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transaction_id?: string;
  created_at: string;
}

export interface Feedback {
  feedback_id: number;
  user_id: number;
  station_id: number;
  booking_id: number;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface Promotion {
  promotion_id: number;
  code: string;
  discount_percent: number;
  max_discount: number;
  min_amount: number;
  valid_from: string;
  valid_to: string;
  status: string;
}

export interface Favorite {
  favorite_id: number;
  user_id: number;
  station_id: number;
  created_at: string;
}

export const NotificationType = {
  SYSTEM: 'system',
  PAYMENT: 'payment',
  PROMOTION: 'promotion',
  BOOKING: 'booking'
} as const;
export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export interface Notification {
  notification_id: number;
  user_id: number | null; // null = gửi tất cả
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}
