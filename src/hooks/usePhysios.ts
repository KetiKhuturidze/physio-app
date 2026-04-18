import { useCallback, useEffect, useState } from 'react';

import { KA } from 'src/constants/strings.ka';
import supabase from 'src/lib/supabase';
import { District, PhysioWithJoins } from 'src/types';

type RawReview = { rating: number };

type RawPhysioRow = {
  id: string;
  user_id: string;
  bio: string | null;
  specialties: string[];
  languages: string[];
  available_hours: string | null;
  base_district_id: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  user: { full_name: string; avatar_url: string | null };
  base_district: District;
  reviews: RawReview[];
};

type UsePhysiosResult = {
  physios: PhysioWithJoins[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

function toPhysioWithJoins(row: RawPhysioRow): PhysioWithJoins {
  const ratings = row.reviews.map((r) => r.rating);
  const review_count = ratings.length;
  const average_rating =
    review_count > 0
      ? Math.round((ratings.reduce((sum, r) => sum + r, 0) / review_count) * 10) / 10
      : undefined;

  return {
    id: row.id,
    user_id: row.user_id,
    bio: row.bio,
    specialties: row.specialties,
    languages: row.languages,
    available_hours: row.available_hours,
    base_district_id: row.base_district_id,
    is_verified: row.is_verified,
    is_active: row.is_active,
    created_at: row.created_at,
    user: row.user,
    base_district: row.base_district,
    average_rating,
    review_count: review_count > 0 ? review_count : undefined,
  };
}

export function usePhysios(districtId: string | null | 'all'): UsePhysiosResult {
  const [physios, setPhysios] = useState<PhysioWithJoins[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  useEffect(() => {
    if (districtId === null) {
      setPhysios([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchPhysios() {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('physio_profiles')
        .select(`
          *,
          user:users!physio_profiles_user_id_fkey(full_name, avatar_url),
          base_district:districts!physio_profiles_base_district_id_fkey(id, name_en, name_ka, center),
          physio_service_areas!inner(district_id),
          reviews(rating)
        `)
        .eq('is_active', true);

      if (districtId !== 'all') {
        query = query.eq('physio_service_areas.district_id', districtId);
      }

      const { data, error: dbError } = await query;

      if (cancelled) return;

      if (dbError) {
        setError(KA.errors.generic);
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as RawPhysioRow[];
      setPhysios(rows.map(toPhysioWithJoins));
      setLoading(false);
    }

    fetchPhysios();

    return () => {
      cancelled = true;
    };
  }, [districtId, fetchKey]);

  return { physios, loading, error, refetch };
}
