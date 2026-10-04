import { useCallback, useEffect, useState } from 'react';

import { KA } from 'src/constants/strings.ka';
import { triggerBookingNotification } from 'src/lib/notifications';
import supabase from 'src/lib/supabase';
import useAuthStore from 'src/stores/useAuthStore';
import {
  BookingStatus,
  BookingWithJoins,
  CreateBookingInput,
  UserRole,
} from 'src/types';

// ─── Shared query fragment ────────────────────────────────────────────────────

// Requires: bookings.service_id uuid → physio_services.id (nullable FK)
// Add in Supabase SQL editor:
//   ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES physio_services(id);
const BOOKING_SELECT = `
  id,
  patient_id,
  physio_id,
  slot_id,
  service_id,
  status,
  patient_address,
  patient_district_id,
  notes,
  requested_time,
  created_at,
  physio_profile:physio_profiles!bookings_physio_id_fkey(
    id,
    available_hours,
    user:users!physio_profiles_user_id_fkey(full_name, avatar_url, phone),
    base_district:districts!physio_profiles_base_district_id_fkey(name_ka)
  ),
  patient:users!bookings_patient_id_fkey(full_name, phone),
  service:physio_services(name, duration_minutes, price)
`;

// ─── Hook ─────────────────────────────────────────────────────────────────────

type UseBookingsResult = {
  bookings: BookingWithJoins[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useBookings(role: UserRole): UseBookingsResult {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<BookingWithJoins[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function fetchBookings() {
      setLoading(true);
      setError(null);

      if (role === 'patient') {
        const { data, error: dbError } = await supabase
          .from('bookings')
          .select(BOOKING_SELECT)
          .eq('patient_id', user!.id)
          .order('created_at', { ascending: false });

        if (cancelled) return;
        if (dbError) {
          setError(KA.errors.generic);
          setLoading(false);
          return;
        }
        setBookings((data ?? []) as unknown as BookingWithJoins[]);
        setLoading(false);
        return;
      }

      // physio: resolve physio_profiles.id from auth user_id first
      const { data: profileRow, error: profileError } = await supabase
        .from('physio_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (cancelled) return;

      if (profileError || !profileRow) {
        setError(KA.errors.generic);
        setLoading(false);
        return;
      }

      const { data, error: dbError } = await supabase
        .from('bookings')
        .select(BOOKING_SELECT)
        .eq('physio_id', profileRow.id)
        .order('created_at', { ascending: false });

      if (cancelled) return;
      if (dbError) {
        setError(KA.errors.generic);
        setLoading(false);
        return;
      }
      setBookings((data ?? []) as unknown as BookingWithJoins[]);
      setLoading(false);
    }

    fetchBookings();

    return () => {
      cancelled = true;
    };
  }, [user, role, fetchKey]);

  return { bookings, loading, error, refetch };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createBooking(
  input: CreateBookingInput,
  patientId: string,
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      patient_id: patientId,
      physio_id: input.physio_id,
      slot_id: null,
      service_id: input.service_id,
      status: 'pending' as BookingStatus,
      patient_address: input.patient_address,
      patient_district_id: input.patient_district_id,
      requested_time: input.requested_time,
      notes: input.notes,
    })
    .select('id')
    .single();

  if (error || !data) {
    return null;
  }

  triggerBookingNotification(data.id, 'new_booking');

  return { id: data.id };
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
): Promise<boolean> {
  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId);

  if (error) {
    return false;
  }

  triggerBookingNotification(bookingId, status);

  return true;
}
