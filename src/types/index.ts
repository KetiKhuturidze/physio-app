export type UserRole = 'patient' | 'physio';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'declined'
  | 'completed'
  | 'cancelled';

export type User = {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  push_token: string | null;
  default_address: string | null;
  default_district_id: string | null;
  created_at: string;
};

export type PhysioProfile = {
  id: string;
  user_id: string;
  bio: string | null;
  specialties: string[];
  languages: string[];
  base_district_id: string | null;
  available_hours: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
};

export type PhysioService = {
  id: string;
  physio_id: string;
  name: string;
  duration_minutes: number;
  price: number;
  description: string | null;
  created_at: string;
};

export type District = {
  id: string;
  name_en: string;
  name_ka: string;
  center: string | null;
};

export type PhysioServiceArea = {
  id: string;
  physio_id: string;
  district_id: string;
};

export type AvailabilitySlot = {
  id: string;
  physio_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
};

export type Booking = {
  id: string;
  patient_id: string;
  physio_id: string;
  slot_id: string | null;
  service_id: string | null;
  status: BookingStatus;
  patient_address: string | null;
  patient_district_id: string | null;
  notes: string | null;
  requested_time: string | null;
  created_at: string;
};

export type PhysioWithJoins = PhysioProfile & {
  user: Pick<User, 'full_name' | 'avatar_url'>;
  base_district: District;
  average_rating?: number;
  review_count?: number;
};

export type BookingWithJoins = Booking & {
  physio_profile: {
    id: string;
    available_hours: string | null;
    user: Pick<User, 'full_name' | 'avatar_url' | 'phone'>;
    base_district: Pick<District, 'name_ka'> | null;
  };
  patient: Pick<User, 'full_name' | 'phone'>;
  service: Pick<PhysioService, 'name' | 'duration_minutes' | 'price'> | null;
};

export type CreateBookingInput = {
  physio_id: string;
  service_id: string | null;
  patient_address: string;
  patient_district_id: string;
  requested_time: string;
  notes: string | null;
};

export type PhysioCertificate = {
  id: string;
  physio_id: string;
  name: string;
  file_url: string;
  uploaded_at: string;
};

export type Review = {
  id: string;
  booking_id: string;
  patient_id: string;
  physio_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type ReviewReportReason = 'spam' | 'offensive' | 'fake' | 'other';

export type ReviewReport = {
  id: string;
  review_id: string;
  reporter_id: string;
  reason: ReviewReportReason;
  created_at: string;
};
